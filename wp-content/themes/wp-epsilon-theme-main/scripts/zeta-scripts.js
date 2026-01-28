const ZetaUtils = (function () {
    return {
        /**
         * Check if window matches max-width: 1000px media query
         * @returns {Boolean} true if media query matches
         */
        isBreakpoint2: function () {
            return window.matchMedia('(max-width: 1000px)').matches;
        },
        /**
         * Prevent default behavior of an event
         * @param {Event} event Event to prevent default behavior
         */
        preventDefaultBehavior: function (event) {
            event.preventDefault();
        },
    };
})();

const ZetaCollapsingMenu = (function () {
    /**
     * Handle menu keyboard navigation including escape, spacebar, and up/down arrows
     * @param {HTMLElement} toggle
     * @param {HTMLElement} list
     * @param {HTMLElement} subMenu
     * @param {String}		type
     */
    function handleSubMenuKeyboardNaviation(toggle, list, subMenu, type) {
        const focusableElements = Array.from(subMenu.querySelectorAll('a'));
        if (!focusableElements.length) return;
        const lastFocusableElement =
            focusableElements[focusableElements.length - 1];
        let currentIndex = -1;

        // Focus on first link
        if (focusableElements.length) {
            focusableElements[0].tabIndex = 0;
            setFocus(0);
        }

        /**
         * Set keyboard focus
         * @param {Number} index
         */
        function setFocus(index) {
            if (index >= 0 && index < focusableElements.length) {
                focusableElements[index].focus();
                currentIndex = index;
            }
        }

        /**
         * Handle focusout events
         * @param {PointerEvent} event
         */
        function handleFocusout(event) {
            // Close menu when tabbing outside
            if (!focusableElements.includes(event.relatedTarget)) {
                closeMenu(toggle, list, subMenu);
            }
        }

        if (type !== 'child-menu') {
            lastFocusableElement.addEventListener('focusout', handleFocusout);
        }
    }

    /**
     * Open menu and close other open menus if the menu prop is present
     * @param {HTMLElement} toggle
     * @param {HTMLElement} list
     * @param {HTMLElement} subMenu
     * @param {HTMLElement} menu
     * @param {String}		type
     */
    function openMenu(toggle, list, subMenu, menu, type) {
        toggle.setAttribute('aria-expanded', 'true');
        list.setAttribute('data-open', '');
        subMenu.setAttribute('aria-hidden', 'false');

        // Handle keyboard navigation
        handleSubMenuKeyboardNaviation(toggle, list, subMenu, type);

        // Close other open menus when opening a menu
        if (menu && type !== 'child-menu') {
            const openMenus = menu.querySelectorAll('[data-open]');
            openMenus.forEach((item) => {
                const itemToggle = item.querySelector('a[href="#"]');
                const itemSubMenu = item.querySelector('.sub-menu');
                if (itemToggle !== toggle) {
                    closeMenu(itemToggle, item, itemSubMenu);
                }
            });
        }

        return;
    }

    /**
     * Close menu
     * @param {HTMLElement} toggle
     * @param {HTMLElement} list
     * @param {HTMLElement} subMenu
     */
    function closeMenu(toggle, list, subMenu) {
        toggle.setAttribute('aria-expanded', 'false');
        list.removeAttribute('data-open');
        subMenu.setAttribute('aria-hidden', 'true');

        return;
    }

    /**
     * Handle menu toggle events
     * @param {PointerEvent} event Pointer event
     * @param {HTMLElement} toggle Toggle element
     * @param {HTMLElement} list List element
     * @param {HTMLElement} subMenu Sub Menu element
     * @param {HTMLElement} menu Menu element
     * @param {String} type Menu type
     */
    function handleCollapsingMenuToggle(
        event,
        toggle,
        list,
        subMenu,
        menu,
        type
    ) {
        event.preventDefault();

        if (toggle.getAttribute('aria-expanded') === 'false') {
            if (type === 'child-menu') {
                openMenu(toggle, list, subMenu, menu, type);
            } else {
                openMenu(toggle, list, subMenu, menu, type);
            }
        } else {
            closeMenu(toggle, list, subMenu);
        }

        /**
         * Close menu when clicking outside
         * @param {PointerEvent} event Click event
         */
        function closeMenuWhenClickingOutside(event) {
            if (event.target !== menu && !menu.contains(event.target)) {
                closeMenu(toggle, list, subMenu);
            }
        }

        // Close main menu when clicking outside
        if (type === 'main-menu') {
            document.addEventListener('click', closeMenuWhenClickingOutside);
        }
    }

    return {
        /**
         * Initalize collapsing menu
         * @param {HTMLElement} menu Menu element
         * @param {String} type Type of menu (main-menu, child-menu, explore-menu)
         */
        init: function (menu, type) {
            if (!menu && !type) return;

            const lists = Array.from(menu.children);
            if (!lists.length) return;

            for (const list of lists) {
                let toggle = null;
                if (type === 'child-menu') {
                    toggle = list.querySelector('.list-item-toggle');
                } else {
                    toggle = list.querySelector('a[href="#"]');
                }
                if (toggle === null) continue; // Skip if no toggle

                const subMenu = list.querySelector('.sub-menu');
                if (!subMenu) continue; // Skip if no sub menu

                if (type !== 'explore-menu') {
                    // Set default aria states
                    toggle.setAttribute('aria-expanded', 'false');
                    subMenu.setAttribute('aria-hidden', 'true');
                }

                // Handle toggle click events
                toggle.addEventListener('click', function (event) {
                    handleCollapsingMenuToggle(
                        event,
                        toggle,
                        list,
                        subMenu,
                        menu,
                        type
                    );
                });
            }
        },
    };
})();

const ZetaExploreMenu = (function () {
    /**
     * Block keyboard focus and pointer events
     * @param {HTMLElement} element
     */
    function blockKeyboardFocus(element) {
        element.setAttribute('tabindex', '-1');
        element.style.pointerEvents = 'none';
    }

    /**
     * Reset keyboard focus and pointer events
     * @param {HTMLElement} element
     */
    function resetKeyboardFocus(element) {
        element.removeAttribute('tabindex');
        element.style.pointerEvents = 'auto';
    }

    /**
     * Set Explore collapsing menu aria states
     * @param {HTMLElement} menu Menu element
     */
    function setMenuAriaStates(menu) {
        const lists = Array.from(menu.children);
        if (!lists.length) return;

        for (const list of lists) {
            const toggle = list.querySelector('a[href="#"]');
            const subMenu = list.querySelector('.sub-menu');
            if (!subMenu) continue;

            if (ZetaUtils.isBreakpoint2()) {
                toggle.setAttribute('aria-expanded', 'false');
                subMenu.setAttribute('aria-hidden', 'true');
                resetKeyboardFocus(toggle);
            } else {
                list.removeAttribute('data-open');
                toggle.removeAttribute('aria-expanded');
                subMenu.removeAttribute('aria-hidden');
                blockKeyboardFocus(toggle);
            }
        }
    }

    /**
     * Open dialog
     * @param {HTMLElement} trigger Trigger element
     * @param {HTMLElement} dialog Dialog element
     */
    function openDialog(trigger, dialog) {
        // Open dialog
        dialog.showModal();

        // Prevent scrolling on body
        document.body.style.overflowY = 'hidden';

        // Set close button
        const closeButton = dialog.querySelector('.utility-explore-toggle');
        if (closeButton) {
            // Close dialog when clicking close button
            closeButton.addEventListener('click', function () {
                // Close dialog
                dialog.close();

                // Return focus to trigger
                trigger.focus();

                // Allow scrolling on body
                document.body.style.overflowY = 'unset';
            });
        }

        // Listen for dialog close event
        dialog.addEventListener('close', resetDialog);
    }

    /**
     * Reset dialog
     */
    function resetDialog() {
        // Allow scrolling on body
        document.body.style.overflowY = 'unset';
    }

    return {
        init: function () {
            const trigger = document.querySelector('.utility-explore-toggle');
            const dialog = document.querySelector('.explore-popup');
            let menu;

            // Handle Explore trigger and dialog
            if (trigger && dialog) {
                // Set menu
                menu = dialog.querySelector('.collapsing-menu');

                // Handle Explore menu button clicks
                trigger.addEventListener('click', function () {
                    openDialog(trigger, dialog);
                });
            }

            // Handle Explore collapsing menu
            if (menu) {
                setMenuAriaStates(menu);
                ZetaCollapsingMenu.init(menu, 'explore-menu');

                // Set default aria states on resize/zoom for accessibility
                window.addEventListener(
                    'resize',
                    function () {
                        setMenuAriaStates(menu);
                    },
                    { passive: true }
                );
            }
        },
    };
})(ZetaUtils, ZetaCollapsingMenu);

const ZetaFooter = (function () {
    /**
     * Handle Footer functionality
     * @param {HTMLElement} footer Footer element
     */
    function handleFooter(footer) {
        // Select footer menu details elements
        const menus = footer.querySelectorAll('.clt-footer-menu');

        menus.forEach((menu) => {
            // Select the summary element
            const summary = menu.querySelector('summary');

            if (ZetaUtils.isBreakpoint2()) {
                // Collapse menu
                menu.open = false;

                // Remove the click listener so users can expand menu
                summary.removeEventListener(
                    'click',
                    ZetaUtils.preventDefaultBehavior
                );

                // Make sure the summary is focusable
                summary.removeAttribute('tabindex');
            } else {
                // Open menu
                menu.open = true;

                // Lock menu so it stays open
                summary.addEventListener(
                    'click',
                    ZetaUtils.preventDefaultBehavior
                );

                // Prevent summary from receiving keybaord focus
                summary.setAttribute('tabindex', '-1');
            }
        });
    }

    return {
        init: function () {
            const footer = document.querySelector('.clt-footer');
            if (!footer) return;

            // Handle Footer functionality
            handleFooter(footer);

            // Handle Footer menu on resize/zoom for accessibility
            window.addEventListener(
                'resize',
                function () {
                    handleFooter(footer);
                },
                { passive: true }
            );
        },
    };
})(ZetaUtils);

const ZetaMainMenu = (function () {
    /**
     * Set menu aria states
     * @param {HTMLElement} menu Menu element
     */
    function setMenuAriaStates(menu) {
        if (ZetaUtils.isBreakpoint2()) {
            menu.setAttribute('aria-hidden', 'true');
        } else {
            menu.removeAttribute('aria-hidden');
        }
    }

    /**
     * Open mobile menu
     * @param {HTMLElement} trigger Trigger element
     * @param {HTMLElement} menu Menu element
     */
    function openMobileMenu(trigger, menu) {
        trigger.setAttribute('aria-expanded', 'true');
        menu.setAttribute('data-open', '');
        menu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('main-menu-open');
    }

    /**
     * Close mobile menu
     * @param {HTMLElement} trigger Trigger element
     *
     */
    function closeMobileMenu(trigger, menu) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.removeAttribute('data-open');
        menu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('main-menu-open');
    }

    /**
     * Toggle mobile menu
     * @param {PointerEvent} event
     */
    function toggleMobileMenu(event) {
        event.preventDefault();
        const menu = document.querySelector('#menu-main-menu');
        const trigger = event.currentTarget;

        if (menu && trigger) {
            const isOpen = menu.hasAttribute('data-open');
            if (isOpen) {
                closeMobileMenu(trigger, menu);
            } else {
                openMobileMenu(trigger, menu);
            }
        }
    }

    return {
        init: function () {
            const menu = document.querySelector('#menu-main-menu');
            const trigger = document.querySelector('.mobile-menu-toggle');
            if (!menu && !trigger) return;

            // Set menu aria states
            setMenuAriaStates(menu);
            window.addEventListener(
                'resize',
                function () {
                    setMenuAriaStates(menu);
                },
                { passive: true }
            );

            // Toggle mobile menu
            trigger.addEventListener('click', toggleMobileMenu);

            // Close mobile menu when pressing escape key while focused on trigger
            trigger.addEventListener('keydown', function (event) {
                const isEsc = event.key === 'Escape';
                if (isEsc && trigger.getAttribute('aria-expanded') === 'true') {
                    event.preventDefault();
                    closeMobileMenu(trigger, menu);
                    trigger.focus();
                }
            });

            // Close mobile menu when pressing escape key
            menu.addEventListener('keydown', function (event) {
                const isEsc = event.key === 'Escape';

                if (isEsc && trigger.getAttribute('aria-expanded') === 'true') {
                    event.preventDefault();
                    closeMobileMenu(trigger, menu);
                    trigger.focus();
                }
            });

            // Close mobile menu when tabbing outside last menu toggle
            const menuToggles = Array.from(
                document.querySelectorAll('#mainmenu .collapsing-menu > li > a')
            );
            const lastMenuItem = menuToggles[menuToggles.length - 1];
            if (lastMenuItem) {
                const lastSubMenu = lastMenuItem.nextElementSibling;
                let lastSubMenuFocusableElements = [];
                let lastSubMenuLastFocusableElement = null;
                if (lastSubMenu && lastSubMenu.classList.contains('sub-menu')) {
                    lastSubMenuFocusableElements = Array.from(
                        lastSubMenu.querySelectorAll('a')
                    );

                    if (lastSubMenuFocusableElements.length) {
                        lastSubMenuLastFocusableElement =
                            lastSubMenuFocusableElements[
                            lastSubMenuFocusableElements.length - 1
                            ];
                    }
                }

                // Close mobile menu when tabbing outside the last menu toggle
                lastMenuItem.addEventListener('focusout', function (event) {
                    if (
                        !menuToggles.includes(event.relatedTarget) &&
                        !lastSubMenuFocusableElements.includes(
                            event.relatedTarget
                        ) &&
                        event.relatedTarget !== trigger
                    ) {
                        closeMobileMenu(trigger, menu);
                        trigger.focus();
                    }
                });

                // Close mobile menu when tabbing outside the last sub menu's last focusable element
                if (lastSubMenuLastFocusableElement) {
                    lastSubMenuLastFocusableElement.addEventListener(
                        'focusout',
                        function (event) {
                            if (
                                !lastSubMenuFocusableElements.includes(
                                    event.relatedTarget
                                )
                            ) {
                                closeMobileMenu(trigger, menu);
                                trigger.focus();
                            }
                        }
                    );
                }
            }
        },
    };
})(ZetaUtils);

document.addEventListener('DOMContentLoaded', function () {
    ZetaExploreMenu.init();
    ZetaMainMenu.init();
    ZetaFooter.init();
});
