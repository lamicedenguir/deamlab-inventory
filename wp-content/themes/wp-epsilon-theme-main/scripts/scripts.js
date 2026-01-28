const Utils = (function () {
    return {
        /**
         * Trap focus within element
         * @param {HTMLElement} element
         */
        trapFocus: function (element) {
            const focusableElements = element.querySelectorAll(
                'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
            );

            if (!focusableElements.length) return;

            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement =
                focusableElements[focusableElements.length - 1];

            function handleKeyboard(event) {
                const isTabPressed = event.key === 'Tab' || event.keyCode === 9;

                if (!isTabPressed) return;

                if (event.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        event.preventDefault();
                    }
                }
            }

            element.addEventListener('keydown', handleKeyboard);
        },
        /**
         * Check if an element is overflowing the viewport
         * @param {HTMLElement} element Element to check
         * @returns {Boolean}
         */
        isOverflown: function (element) {
            return (
                element.scrollHeight > element.clientHeight ||
                element.scrollWidth > element.clientWidth
            );
        },
        /**
         * Check if media query matches a max-width of 1000px
         * @returns {Boolean}
         */
        isMobile: function () {
            return window.matchMedia('(max-width: 1000px)').matches;
        },
        spinner: `<svg class="clt-spinner-svg" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.clt-spinner-inline{fill:currentColor;transform-origin:center;animation:spin .75s step-end infinite}@keyframes spin{8.3%{transform:rotate(30deg)}16.6%{transform:rotate(60deg)}25%{transform:rotate(90deg)}33.3%{transform:rotate(120deg)}41.6%{transform:rotate(150deg)}50%{transform:rotate(180deg)}58.3%{transform:rotate(210deg)}66.6%{transform:rotate(240deg)}75%{transform:rotate(270deg)}83.3%{transform:rotate(300deg)}91.6%{transform:rotate(330deg)}100%{transform:rotate(360deg)}}</style><g class="clt-spinner-inline"><rect x="11" y="1" width="2" height="5" opacity=".14"/><rect x="11" y="1" width="2" height="5" transform="rotate(30 12 12)" opacity=".29"/><rect x="11" y="1" width="2" height="5" transform="rotate(60 12 12)" opacity=".43"/><rect x="11" y="1" width="2" height="5" transform="rotate(90 12 12)" opacity=".57"/><rect x="11" y="1" width="2" height="5" transform="rotate(120 12 12)" opacity=".71"/><rect x="11" y="1" width="2" height="5" transform="rotate(150 12 12)" opacity=".86"/><rect x="11" y="1" width="2" height="5" transform="rotate(180 12 12)"/></g></svg>`,
        isValidUrl: function (url) {
            try {
                new URL(url);
                return true;
            } catch (error) {
                return false;
            }
        },
    };
})();

const SidebarSubMenu = (function () {
    const selectors = {
        trigger: '.submenu-dropdown-trigger',
        menuList: '.submenu-list',
    };

    function handleSubMenuMobile() {
        const trigger = document.querySelector(selectors.trigger);
        const menuList = document.querySelector(selectors.menuList);

        if (!trigger || !menuList) return;

        trigger.addEventListener('click', function () {
            this.classList.toggle('open');
            this.setAttribute(
                'aria-expanded',
                this.getAttribute('aria-expanded') === 'false'
                    ? 'true'
                    : 'false'
            );

            menuList.classList.toggle('open');
        });
    }

    return {
        init: function () {
            handleSubMenuMobile();
        },
    };
})();

const WPBlockElementA11y = (function () {
    const selectors = {
        overflowableElements: '.wp-block-table, .wp-block-code',
        getwidLinks: 'a.wp-block-getwid-icon__wrapper',
        divRoleImg: 'div[role="img"]',
    };

    function handleOverflowElements() {
        const overflowableElements = document.querySelectorAll(
            selectors.overflowableElements
        );

        if (!overflowableElements.length) return;

        overflowableElements.forEach((element) => {
            if (Utils.isOverflown(element)) {
                element.setAttribute('tabindex', '0');
            }
        });
    }

    function handleGetwidIconLinks() {
        const links = document.querySelectorAll(selectors.getwidLinks);
        if (!links.length) return;

        links.forEach((link) => {
            const url = new URL(link.href) || '';

            if (url.hostname) {
                link.setAttribute('aria-label', `Visit ${url.hostname}`);
            }
        });
    }

    function handleDivImg() {
        const divRoleImg = document.querySelectorAll(selectors.divRoleImg);
        if (!divRoleImg.length) return;

        divRoleImg.forEach((div) => div.setAttribute('aria-hidden', true));
    }

    function handleGoogleCalendarIframes() {
        const iframes = document.querySelectorAll('iframe');
        if (!iframes.length) return;

        iframes.forEach((iframe) => {
            if (!Utils.isValidUrl(iframe.src)) return;

            const src = new URL(iframe.src);
            if (src.hostname === 'calendar.google.com') {
                src.pathname = '/calendar/htmlembed';
                src.searchParams.set('bgcolor', '#ffffff');
                iframe.src = src;
            }
        });
    }

    return {
        init: function () {
            handleOverflowElements();
            handleGetwidIconLinks();
            handleDivImg();
            handleGoogleCalendarIframes();
        },
    };
})(Utils);

const LocalistWidgets = (function () {
    const selectors = {
        eventCardTitle:
            '.localist-widget-customer .widget-event .widget-content .title h4',
        eventSidebarTitle: '.localist-widget-eds .localist-title h4',
        miniCalendarNav: '.localist_minicalendar select[name="type"]',
    };

    function updateEventTitleElements() {
        const eventTitles = document.querySelectorAll(
            `${selectors.eventCardTitle}, ${selectors.eventSidebarTitle}`
        );
        if (!eventTitles.length) return;

        eventTitles.forEach((title) => {
            const content = title.innerHTML;
            const span = document.createElement('span');

            span.innerHTML = content;
            title.parentNode.replaceChild(span, title);
        });
    }

    function updateMiniCalendarNav() {
        const select = document.querySelector(selectors.miniCalendarNav);
        if (!select) return;

        select.setAttribute('aria-label', 'Choose Event Type');
    }

    return {
        init: function () {
            updateEventTitleElements();
            updateMiniCalendarNav();
        },
    };
})();

const CLTCards = (function () {
    const handleCardClicks = function (card) {
        const clickableElements = card.querySelectorAll('a');
        if (clickableElements.length) {
            clickableElements.forEach((element) => {
                element.addEventListener('click', (event) =>
                    event.stopPropagation()
                );
            });
        }

        const cardLink = card.querySelector('[data-card-link]');
        if (cardLink) {
            card.classList.add('js-linkify');
            card.addEventListener('click', () => {
                const noTextSelected = !window.getSelection().toString();

                if (noTextSelected) {
                    cardLink.click();
                }
            });
        }
    };

    return {
        init: function () {
            const cards = document.querySelectorAll('.card');
            if (!cards.length) return;

            cards.forEach((card) => {
                if (!card.dataset.cltLinkifyInitialized) {
                    handleCardClicks(card);
                    card.dataset.cltLinkifyInitialized = 'true';
                }
            });
        },
    };
})();

const CustomTemplateExposedFilters = (function () {
    let form;
    let buttons;

    function handleFormInput(event) {
        const select = event.target;
        const label = select.parentNode.firstElementChild ?? undefined;

        if (label && !label.children.length) {
            label.insertAdjacentHTML('beforeend', Utils.spinner);
            label.style.cursor = 'not-allowed';
        }

        form.submit();
    }

    function handleButtonClick(event) {
        const button = event.target;

        // Add spinner icon within button
        if (!button.children.length) {
            button.insertAdjacentHTML('beforeend', Utils.spinner);
            button.style.cursor = 'not-allowed';
        }

        // Reload the page on reset button click to reset filters
        if (button.type === 'reset') {
            window.location.href =
                window.location.origin + window.location.pathname;
        }
    }

    return {
        init: function () {
            form = document.querySelector(
                'form.clt-exposed-filters.clt-template'
            );
            if (!form) return;

            form.addEventListener('input', handleFormInput);

            buttons = form.querySelectorAll('button');
            buttons.forEach((button) =>
                button.addEventListener('click', handleButtonClick)
            );
        },
    };
})(Utils);

const ListingTemplateFilters = (function () {
    let form;
    let search;
    let buttons;
    let chips;
    let clearFilters;
    let groups;
    let pagination;

    // Set group details element open status via session storage
    function handleGroupInit(group) {
        const key = 'filter_group_' + group.dataset.sidebarFilterGroup;
        const value = {
            open: Utils.isMobile() ? false : group.open,
        };
        const groupState = sessionStorage.getItem(key);

        if (groupState) {
            const { open } = JSON.parse(groupState);
            group.open = open;
        } else {
            sessionStorage.setItem(key, JSON.stringify(value));
        }
    }

    function handleGroupToggle(event) {
        const group = event.target;
        const key = 'filter_group_' + group.dataset.sidebarFilterGroup;
        sessionStorage.setItem(key, JSON.stringify({ open: group.open }));
    }

    function handleButtonClick(event) {
        // Only run for button elements
        if (event.target.nodeName !== 'BUTTON') return;

        const button = event.target;
        const groupId = button.dataset.sidebarFilterClearGroup;

        // Add spinner icon within button
        if (!button.children.length) {
            button.insertAdjacentHTML('beforeend', Utils.spinner);
            button.style.cursor = 'not-allowed';
        }

        // Remove individual group's filters and submit the form to refresh
        if (groupId) {
            const group = form.querySelector(
                `[data-sidebar-filter-group="${groupId}"]`
            );
            if (group) {
                group
                    .querySelectorAll('input[type="checkbox"]')
                    .forEach((input) => input.removeAttribute('checked'));
            }
            form.submit();
            return; // return to skip next check
        }

        // Reload the page on reset button click to reset filters
        if (button.type === 'reset') {
            window.location.href =
                window.location.origin + window.location.pathname;
        }
    }

    function handleChipClick(event) {
        const chip = event.target;
        const icon = chip.querySelector('.filtered-by__chip-remove');
        const termId = chip.dataset.termId;
        const checkboxes = Array.from(
            form.querySelectorAll('input[type="checkbox"]')
        );

        icon.innerHTML = Utils.spinner;

        checkboxes.map((input) => {
            if (termId === input.value) {
                input.removeAttribute('checked');
                form.submit();
            }
        });
    }

    function handlePaginationClick(event) {
        const element = event.target;
        if (element.nodeName !== 'A') return;

        if (!element.children.length) {
            element.insertAdjacentHTML('beforeend', Utils.spinner);
            element.style.cursor = 'not-allowed';
        }
    }

    function handleResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            if (window.matchMedia('(max-width: 1000px)').matches) {
                if (!document.querySelector('.sidebar-filter__mobile')) {
                    const details = document.createElement('details');
                    details.classList.add('sidebar-filter__mobile');
                    const summary = document.createElement('summary');
                    summary.textContent = 'Filters Menu';
                    summary.classList.add('sidebar-filter__label', 'mobile');

                    form.parentNode.insertBefore(details, form);
                    details.appendChild(form);
                    form.insertAdjacentElement('beforebegin', summary);
                }
            } else {
                if (document.querySelector('.sidebar-filter__mobile')) {
                    form.parentNode.parentNode.appendChild(form);
                    document.querySelector('.sidebar-filter__mobile').remove();
                }
            }
        });

        resizeObserver.observe(document.body);
    }

    return {
        init: function () {
            form = document.querySelector('form.sidebar-filter');
            if (!form) return;
            handleResize();

            search = document.querySelector('.listing-template .search');
            if (search) {
                search.addEventListener('click', handleButtonClick);
            }

            groups = form.querySelectorAll('[data-sidebar-filter-group]');
            if (groups.length) {
                if (Utils.isMobile()) {
                    groups.forEach((group) => {
                        group.removeAttribute('open');
                    });
                }

                if (window.sessionStorage) {
                    groups.forEach((group) => {
                        handleGroupInit(group);
                        group.addEventListener('toggle', handleGroupToggle);
                    });
                }
            }

            buttons = form.querySelectorAll('button');
            if (buttons.length) {
                buttons.forEach((button) =>
                    button.addEventListener('click', handleButtonClick)
                );
            }

            chips = document.querySelectorAll('.filtered-by__chip button');
            if (chips.length) {
                chips.forEach((chip) =>
                    chip.addEventListener('click', handleChipClick)
                );
            }

            clearFilters = document.querySelector('.filtered-by__reset');
            if (clearFilters) {
                clearFilters.addEventListener('click', handleButtonClick);
            }

            pagination = document.querySelector(
                '.listing-template .pagination'
            );
            if (pagination) {
                pagination.addEventListener('click', handlePaginationClick);
            }
        },
    };
})(Utils);

const BrandStandards = (function () {
    /**
     * Open external links in a new tab
     */
    function openExternalLinksInNewTab() {
        const siteHostname = window.location.hostname;
        const links = document.querySelectorAll('a');
        if (!links.length) return;

        links.forEach((link) => {
            if (!Utils.isValidUrl(link.href)) return;

            const hostname = new URL(link.href).hostname;
            if (
                hostname &&
                !hostname.match(/charlotte.edu|uncc.edu/gi) &&
                hostname !== siteHostname
            ) {
                link.setAttribute('target', '_blank');
            }
        });
    }

    return {
        init: function () {
            openExternalLinksInNewTab();
        },
    };
})(Utils);

const YouTubeURLs = (function () {
    const parseYouTubeURL = function (link) {
        let url;
        const youTubeHostnames = [
            'www.youtube.com',
            'youtu.be',
            'www.youtube-nocookie.com',
            'm.youtube.com',
        ];

        try {
            url = new URL(link);
        } catch (error) {
            return;
        }

        // Only proceed if the URL is a YouTube URL
        if (!youTubeHostnames.includes(url.hostname)) return;

        if (url.hostname === 'youtu.be') {
            const pathname = url.pathname;
            url.pathname = `/embed${pathname}`;
        }

        if (url.pathname === '/watch') {
            const videoId = url.search.split('v=')[1];
            url.pathname = `/embed/${videoId}`;
        }

        if (url.hostname === 'www.youtube-nocookie.com') {
            return url;
        }

        url.hostname = 'www.youtube.com';

        return url;
    };

    return {
        init: function () {
            const iframes = document.querySelectorAll('iframe');
            if (!iframes) return;

            iframes.forEach((iframe) => {
                const src = iframe.getAttribute('src');
                const youTubeURL = parseYouTubeURL(src);

                if (!youTubeURL) return;

                youTubeURL.searchParams.set('enablejsapi', 1);
                youTubeURL.searchParams.set('html5', 1);

                iframe.src = youTubeURL.href;
            });
        },
    };
})();

const BrizyFixes = (function () {
    function setBrizyLandmarks(container) {
        if (!container) return;

        // Set the main landmark
        container.setAttribute('role', 'main');
        container.setAttribute('aria-label', 'Main Content');
        container.setAttribute('tabindex', '-1');
    }

    return {
        init: function () {
            const brizyContainer = document.querySelector(
                '.brz-root__container'
            );
            if (!brizyContainer) return;

            setBrizyLandmarks(brizyContainer);
        },
    };
})();

/**
 * Inits
 */
document.addEventListener('DOMContentLoaded', function () {
    SidebarSubMenu.init();
    WPBlockElementA11y.init();
    LocalistWidgets.init();
    CLTCards.init();
    CustomTemplateExposedFilters.init();
    ListingTemplateFilters.init();
    BrandStandards.init();
    YouTubeURLs.init();
    BrizyFixes.init();
});