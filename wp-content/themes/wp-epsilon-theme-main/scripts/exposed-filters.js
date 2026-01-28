class CLTBlock {
    constructor(block, data) {
        // Initial checks
        if (typeof block === 'undefined') return;
        if (typeof data === 'undefined') return;

        this.spinner = `<svg class="clt-spinner-svg" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.clt-spinner-inline{transform-origin:center;animation:spin .75s step-end infinite}@keyframes spin{8.3%{transform:rotate(30deg)}16.6%{transform:rotate(60deg)}25%{transform:rotate(90deg)}33.3%{transform:rotate(120deg)}41.6%{transform:rotate(150deg)}50%{transform:rotate(180deg)}58.3%{transform:rotate(210deg)}66.6%{transform:rotate(240deg)}75%{transform:rotate(270deg)}83.3%{transform:rotate(300deg)}91.6%{transform:rotate(330deg)}100%{transform:rotate(360deg)}}</style><g class="clt-spinner-inline"><rect x="11" y="1" width="2" height="5" opacity=".14"/><rect x="11" y="1" width="2" height="5" transform="rotate(30 12 12)" opacity=".29"/><rect x="11" y="1" width="2" height="5" transform="rotate(60 12 12)" opacity=".43"/><rect x="11" y="1" width="2" height="5" transform="rotate(90 12 12)" opacity=".57"/><rect x="11" y="1" width="2" height="5" transform="rotate(120 12 12)" opacity=".71"/><rect x="11" y="1" width="2" height="5" transform="rotate(150 12 12)" opacity=".86"/><rect x="11" y="1" width="2" height="5" transform="rotate(180 12 12)"/></g></svg>`;

        // AJAX default vars
        this.ajaxUrl = data.ajaxUrl;
        this.action = data.action;
        this.nonce = data.nonce;
        this.postId = data.postId;
        this.url = new URL(this.ajaxUrl);

        // Block vars
        this.block = block;
        this.baseArgs = block.dataset.baseArgs
            ? JSON.parse(block.dataset.baseArgs)
            : {};
        if (!Object.keys(this.baseArgs).length) {
            throw new Error(
                'Block arguments not found. Please refresh the page and try again. If this error persists, please contact Web Services.'
            );
        }
        this.filters = this.block.querySelector('.clt-exposed-filters');
        this.searchEl = this.block.querySelector('.clt-form-search');
        this.selectEls = this.block.querySelectorAll('.clt-form-select');
        this.filterTypes = this.selectEls.length
            ? Array.from(this.selectEls).map((el) => el.getAttribute('name'))
            : [];
        this.resetButton = this.block.querySelector('.clt-form-reset');
        this.renderTarget = this.block.querySelector('[data-render-target]');
        this.pagination = this.block.querySelector('.pagination');
        this.currentPage = this.pagination
            ? parseInt(
                this.pagination.querySelector('.current').textContent.trim()
            )
            : 0;

        // Helper vars
        this.previousValue = '';
        this.typingTimer;
        this.isSpinnerVisible = false;
        this.canReset = false;
        this.paged = 0;
        this.didPagination = false;
        this.canScroll = false;
        this.targetHeight = 0;

        // Inits and events
        this.setDefaultUrlParams();
        this.events();
        this.handleScroll();
    }

    setDefaultUrlParams() {
        this.url.searchParams.set('action', this.action || '');
        this.url.searchParams.set('nonce', this.nonce || '');
        this.url.searchParams.set('postid', this.postId || '');

        if (
            typeof this.baseArgs === 'object' &&
            Object.keys(this.baseArgs).length
        ) {
            for (const [key, value] of Object.entries(this.baseArgs)) {
                this.url.searchParams.set(key, value);
            }
        }
    }

    events() {
        if (this.searchEl) {
            this.searchEl.addEventListener('keyup', (event) =>
                this.handleInput(event)
            );
            this.searchEl.addEventListener('search', (event) =>
                this.handleInput(event)
            );
        }

        if (this.selectEls.length) {
            this.selectEls.forEach((el) => {
                el.addEventListener('input', () => this.handleSelect(el));
            });
        }

        if (this.pagination) {
            this.pagination.addEventListener('click', (event) =>
                this.handlePagination(event)
            );
        }

        if (this.resetButton) {
            this.resetButton.addEventListener('click', () =>
                this.resetFilters()
            );
        }
    }

    handleInput(event) {
        const search = event.target.value;

        if (search !== this.previousValue) {
            clearTimeout(this.typingTimer);

            if (search.trim().length > 1) {
                this.typingTimer = setTimeout(() => {
                    this.resetPaged();
                    this.url.searchParams.set(
                        's',
                        search.toString().trim().toLowerCase()
                    );
                    this.getPosts();
                }, 500);
            }
        }

        if (event.key === 'Escape' || search.length === 0) {
            this.resetSearch();
        }

        this.previousValue = search;
    }

    handleSelect(el) {
        const filterType = el.getAttribute('name');
        if (!filterType) return;

        this.resetPaged();

        if (el.value !== 'default') {
            this.url.searchParams.set(filterType, el.value);
            this.getPosts();
        } else {
            this.url.searchParams.delete(filterType);
            this.paged = 0;
            this.getPosts();
        }
    }

    handlePagination(event) {
        event.preventDefault();
        const target = event.target;
        if (
            !target.matches('.page-numbers') ||
            target.matches('.current') ||
            target.matches('.dots')
        )
            return;

        this.didPagination = true;
        const spinner = target.querySelector('.clt-spinner-svg');
        if (!spinner) {
            this.setScrollValues();
            target.insertAdjacentHTML('beforeend', this.spinner);
        }

        if (target.matches('.prev')) {
            this.paged = this.currentPage - 1;
            this.url.searchParams.set('paged', this.paged);
            this.getPosts();
        }

        if (target.matches('.next')) {
            this.paged = this.currentPage + 1;
            this.url.searchParams.set('paged', this.paged);
            this.getPosts();
        }

        if (target.classList.length === 1 && target.matches('.page-numbers')) {
            this.paged = parseInt(target.textContent).toString();
            this.url.searchParams.set('paged', this.paged);
            this.getPosts();
        }
    }

    async getPosts() {
        if (!this.didPagination) {
            if (!this.isSpinnerVisible) this.addSpinner();
        }
        this.canReset = true;
        if (this.resetButton) this.resetButton.disabled = false;

        fetch(this.url)
            .then((results) => {
                if (results.ok) {
                    return results.text();
                } else {
                    throw new Error();
                }
            })
            .then((html) => {
                this.renderPosts(html);
            })
            .catch(() => {
                this.renderPosts(`
                <p>Something went wrong. Please refresh the page and try again. Contact <a href="https://help.charlotte.edu" target="_blank">Web Services</a> if this issue persists.</p>
                `);
            });
    }

    addSpinner() {
        this.setScrollValues();
        this.renderTarget.innerHTML = this.spinner;
        this.isSpinnerVisible = true;
    }

    renderPosts(html) {
        this.renderTarget.innerHTML = html;
        this.renderTarget.style.height = 'auto';
        this.isSpinnerVisible = false;
        this.resetPagination();

        if (this.didPagination) {
            if (this.canScroll) {
                window.scrollTo({
                    behavior: 'smooth',
                    top:
                        this.block.getBoundingClientRect().top -
                        document.body.getBoundingClientRect().top -
                        30,
                });
            }

            this.didPagination = false;
        }

        // Clickifies cards using the card title link
        CLTCards.init();
    }

    handleScroll() {
        let regex = /\D/g;
        let top = '0px';

        if (this.filters) {
            let style = getComputedStyle(this.filters);
            let filterMargin = Number(style.marginBottom.replace(regex, ''));
            top = `-${String(this.filters.offsetHeight + filterMargin)}px`;
        }

        let footer = document.querySelector('footer .footer__header');
        let bottom = footer ? `-${String(footer.offsetHeight)}px` : '0px';

        const config = {
            rootMargin: `${top} 0px ${bottom} 0px`,
            threshold: 1,
        };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio !== 1) {
                    this.canScroll = true;
                } else {
                    this.canScroll = false;
                }
            });
        }, config);

        observer.observe(this.renderTarget);
    }

    setScrollValues() {
        this.targetHeight = this.renderTarget.clientHeight;
        this.renderTarget.style.height = `${this.targetHeight.toString()}px`;
    }

    resetFilters() {
        if (this.canReset) {
            if (this.searchEl) {
                this.searchEl.value = '';
                this.previousValue = '';
            }

            if (this.selectEls.length) {
                this.selectEls.forEach((el) => (el.value = 'default'));
            }

            this.resetUrl();
            this.getPosts();
        }

        this.canReset = false;

        if (this.resetButton) this.resetButton.disabled = true;
    }

    resetSearch() {
        if (this.searchEl) this.searchEl.value = '';
        this.url.searchParams.delete('s');
    }

    resetUrl() {
        this.url.searchParams.delete('s');
        this.url.searchParams.set('paged', this.baseArgs?.paged || '0');

        if (this.filterTypes.length) {
            this.filterTypes.forEach((type) => {
                this.url.searchParams.delete(type);
            });
        }
    }

    resetPaged() {
        this.paged = 0;
        this.url.searchParams.set('paged', this.paged);
    }

    resetPagination() {
        this.pagination = this.block.querySelector('.pagination');

        if (this.pagination) {
            this.currentPage = this.pagination.querySelector('.current')
                ? parseInt(
                    this.pagination
                        .querySelector('.current')
                        .textContent.trim()
                )
                : 1;
            this.pagination.addEventListener('click', (event) =>
                this.handlePagination(event)
            );
        }
    }

    removePagination() {
        this.block
            .querySelectorAll('.pagination')
            .forEach((item) => item.remove());
    }
}

const ExposedFilters = (function () {
    return {
        init: function () {
            document.addEventListener('DOMContentLoaded', function () {
                if (
                    typeof cltDirectoryData === 'undefined' ||
                    typeof cltPostListData === 'undefined'
                ) {
                    throw new Error(
                        'Base search data not found. Please refesh the page and contact Web Services at help.charlotte.edu is this error persists.'
                    );
                }

                document
                    .querySelectorAll('[data-clt-block="directory"]')
                    .forEach((block) => new CLTBlock(block, cltDirectoryData));

                document
                    .querySelectorAll('[data-clt-block="post-list"]')
                    .forEach((block) => new CLTBlock(block, cltPostListData));
            });
        },
    };
})(CLTCards);

ExposedFilters.init();