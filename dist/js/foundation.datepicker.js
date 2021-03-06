'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($, mu, mm) {

    /**
     * Datepicker module.
     * @module foundation.datepicker
     * @requires foundation.dropdown
     * @requires foundation.util.keyboard
     * @requires foundation.util.triggers
     */

    var Datepicker = function () {
        /**
         * Creates a new instance of a datepicker.
         * @class
         * @param {jQuery} element - jQuery object to attach a datepicker to.
         * @param {Object} options - Overrides to the default plugin settings.
         */
        function Datepicker(element, options) {
            _classCallCheck(this, Datepicker);

            this.$element = element;

            if (!this.$element.is('input[type="text"]')) {
                console.warn('The datepicker can only be used on an <input> element with type="text".');
                return;
            }

            this.options = $.extend({}, Datepicker.defaults, this.$element.data(), options);
            this._init();

            Foundation.registerPlugin(this, 'Datepicker');
            Foundation.Keyboard.register('Datepicker', {
                'ENTER': 'open',
                'ESCAPE': 'close',
                'TAB': 'tab_forward',
                'SHIFT_TAB': 'tab_backward'
            });
        }

        /**
         * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
         * @function
         * @private
         */


        _createClass(Datepicker, [{
            key: '_init',
            value: function _init() {
                var $id = this.$element.attr('id') ? this.$element.attr('id') : Foundation.GetYoDigits(6, 'datepicker'),
                    $ddId = Foundation.GetYoDigits(6, 'datapicker-dropdown');

                mm.updateLocale(this.options.locale, {
                    week: { dow: this.options.weekstart }
                });
                mm.locale(this.options.locale);

                this.$element.attr({
                    'id': $id,
                    'data-toggle': $ddId
                });

                if (!this.$element.parent().is('.datepicker-wrapper')) this.$element.wrap($('<div class="datepicker-wrapper">'));

                this.$dropdown = $('<div id="' + $ddId + '" class="datepicker-dropdown" data-dropdown></div>');
                this.$dropdown.attr({
                    'data-v-offset': this.options.vOffset,
                    'data-h-offset': 0,
                    'data-close-on-click': this.options.closeOnClick
                });

                if ($.inArray(this.options.size, ['tiny', 'small', 'large']) > -1) this.$dropdown.addClass(this.options.size);

                this.$element.after(this.$dropdown);
                this.$dropdown.foundation();

                this.$date = this.$element.val() == '' ? mm().startOf('date') : mm(this.$element.val(), this.options.format, true);
                this.$viewDate = this.$date.clone();

                this._events();
                this.selectedDate = mm();
            }
        }, {
            key: '_buildCalendar',
            value: function _buildCalendar() {
                var $calendar = $('<div class="datepicker-calendar">'),
                    $nav = $('<nav>' + this.$viewDate.format('MMMM YYYY') + '</nav>'),
                    $subtractButton = $('<a data-date-nav="month" data-method="subtract"><i class="fa fa-chevron-left"></i></a>'),
                    $addButton = $('<a data-date-nav="month" data-method="add"><i class="fa fa-chevron-right"></i></a>'),
                    $weekdays = $('<div class="weekdays row small-up-7 collapse">'),
                    $days = $('<div class="days row small-up-7 collapse">'),
                    $first = mm(this.$viewDate.format('YYYY-MM-DD')),
                    $last = $first.clone();

                $calendar.append($nav);
                $nav.prepend($subtractButton).append($addButton);

                $calendar.append($weekdays);
                for (var i = this.options.weekstart; i < this.options.weekstart + 7; i++) {
                    var weekday = i;
                    if (weekday > 6) weekday = weekday - 7;

                    var name = mm().day(weekday).format('ddd');
                    $weekdays.append($('<div class="column">' + name + '</div>'));
                }

                $calendar.append($days);
                $first.startOf('month');
                $first.startOf('week');
                $last.endOf('month');
                $last.endOf('week');
                for ($first; !$first.isAfter($last.format('YYYY-MM-DD')); $first.add(1, 'day')) {
                    var dayType = $first.isSame(this.$date.format('YYYY-MM-DD'), 'day') ? 'current' : $first.isSame(this.$date.format('YYYY-MM-DD'), 'month') ? $first.isSame(mm().format('YYYY-MM-DD'), 'day') ? 'same-month today' : 'same-month' : 'other-month';

                    $days.append($('<div class="column"><a class="' + dayType + '" data-set-date="' + $first.format('YYYY-MM-DD') + '">' + $first.date() + '</a></div>'));
                }

                this.$dropdown.empty();
                this.$dropdown.append($calendar);
                $calendar.foundation();

                this._calendarEvents();
            }
        }, {
            key: '_calendarEvents',
            value: function _calendarEvents() {
                this.$dropdown.find('a[data-date-nav]').off('click').on('click', this._navigateDate.bind(this));
                this.$dropdown.find('a[data-set-date]').off('click').on('click', this._setDate.bind(this));
                if (this.options.closeOnClick) this._overrideBodyHandler();
            }
        }, {
            key: '_navigateDate',
            value: function _navigateDate(e) {
                var $targetData = $(e.currentTarget).data();
                this.$viewDate[$targetData.dateNav](1, $targetData.method);
                this._buildCalendar();
            }
        }, {
            key: '_setDate',
            value: function _setDate(e) {
                var date = mm($(e.currentTarget).data('set-date'));

                this.$date.set({ 'year': date.get('year'), 'month': date.get('month'), 'date': date.get('date') });
                this.$element.val(this.$date.format(this.options.format));
                this.$viewDate = this.$date.clone();
                if (this.options.closeOnSelect && !this.options.time) {
                    this.$dropdown.trigger('close');
                    this.$element.focus();
                } else if (this.options.time) this._buildCalendar();else this._buildCalendar();
            }
        }, {
            key: 'buildTimePicker',
            value: function buildTimePicker() {
                this.preventFalseBodyClick = true;
                this.$dropdown.html('');
                var timeparts = ['hour', 'minute'];
                if (this.options.meridiem) timeparts.push('meridiem');

                var hours = this.buildHours();
                var minutes = this.buildMinutes();
                var meridiems = this.options.meridiem ? this.buildMeridien() : '';

                var timepickerModel = {
                    date: this.selectedDate.format('DD MMMM YYYY'),
                    coll_count: timeparts.length,
                    timeparts: hours + minutes + meridiems
                };

                var $timepicker = $(mu.render(this.options.timePickerTemplate, timepickerModel));

                $timepicker.on('click', '.nav-datepicker', this.buildCalendar.bind(this)).on('click', '.hour-up:not(.disabled)', this.addHour.bind(this)).on('click', '.hour-down:not(.disabled)', this.subtractHour.bind(this)).on('click', '.minute-up:not(.disabled)', this.addMinute.bind(this)).on('click', '.minute-down:not(.disabled)', this.subtractMinute.bind(this)).on('click', '.meridiem-up:not(.disabled)', this.addMeridiem.bind(this)).on('click', '.meridiem-down:not(.disabled)', this.subtractMeridiem.bind(this)).on('click', '.close-datepicker', this.close.bind(this));

                this.$dropdown.append($timepicker);
            }
        }, {
            key: 'buildHours',
            value: function buildHours() {
                var hours = [];
                if (this.options.meridiem) hours = ['11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01', '12'];else hours = ['23', '22', '21', '20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01', '00'];
                return this.buildTimePartSelector(hours, 'hour');
            }
        }, {
            key: 'buildMinutes',
            value: function buildMinutes() {
                var minutes = [];
                for (var i = 60 - this.options.minuteInterval; i >= 0; i = i - this.options.minuteInterval) {
                    minutes.push(i < 10 ? '0' + i : '' + i);
                }
                return this.buildTimePartSelector(minutes, 'minute');
            }
        }, {
            key: 'buildMeridien',
            value: function buildMeridien() {
                return this.buildTimePartSelector(['PM', 'AM'], 'meridiem');
            }
        }, {
            key: 'buildTimePartSelector',
            value: function buildTimePartSelector(items, part) {
                var _this = this;
                var options = '';
                $.each(items, function (index, item) {
                    options += mu.render(_this.options.timeOptionTemplate, {
                        option: item,
                        timepart: part
                    });
                });
                return mu.render(this.options.timePartSelectorTemplate, {
                    options: options,
                    timepart: part
                });
            }
        }, {
            key: 'addHour',
            value: function addHour(e) {
                this.selectedDate.add(1, 'hours');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.hour-down').removeClass('disabled');
                var option = this.options.meridiem ? this.selectedDate.format('hh') : this.selectedDate.format('HH');
                var $option = $selector.find('.' + option + '-hour');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':first-child')) {
                    $(e.target).addClass('disabled');
                }
            }
        }, {
            key: 'subtractHour',
            value: function subtractHour(e) {
                this.selectedDate.subtract(1, 'hours');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.hour-up').removeClass('disabled');
                var option = this.options.meridiem ? this.selectedDate.format('hh') : this.selectedDate.format('HH');
                var $option = $selector.find('.' + option + '-hour');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':last-child')) {
                    $(e.target).addClass('disabled');
                }
            }
        }, {
            key: 'addMinute',
            value: function addMinute(e) {
                this.selectedDate.add(this.options.minuteInterval, 'minutes');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.minute-down').removeClass('disabled');
                var option = this.selectedDate.format('mm');
                var $option = $selector.find('.' + option + '-minute');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':first-child')) {
                    $(e.target).addClass('disabled');
                }
            }
        }, {
            key: 'subtractMinute',
            value: function subtractMinute(e) {
                this.selectedDate.subtract(this.options.minuteInterval, 'minutes');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.minute-up').removeClass('disabled');
                var option = this.selectedDate.format('mm');
                var $option = $selector.find('.' + option + '-minute');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':last-child')) {
                    $(e.target).addClass('disabled');
                }
            }
        }, {
            key: 'addMeridiem',
            value: function addMeridiem(e) {
                this.selectedDate.add(12, 'hours');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.meridiem-down').removeClass('disabled');
                var option = this.selectedDate.format('A');
                var $option = $selector.find('.' + option + '-meridiem');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':first-child')) {
                    $(e.target).addClass('disabled');
                }
            }
        }, {
            key: 'subtractMeridiem',
            value: function subtractMeridiem(e) {
                this.selectedDate.subtract(12, 'hours');
                this.$element.val(this.selectedDate.format(this.options.format));
                var $selector = $(e.target).parent();
                $('.meridiem-up').removeClass('disabled');
                var option = this.selectedDate.format('A');
                var $option = $selector.find('.' + option + '-meridiem');
                var optionDims = Foundation.Box.GetDimensions($option);
                var bottomOffset = optionDims.height + optionDims.offset.top - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
                $option.parent().animate({ 'bottom': bottomOffset + 'px' }, '600', 'swing');
                if ($option.is(':last-child')) {
                    $(e.target).addClass('disabled');
                }
            }

            /**
             * Adds event listeners to the element utilizing the triggers utility library.
             * @function
             * @private
             */

        }, {
            key: '_events',
            value: function _events() {
                var _this = this;

                this.$dropdown.on('show.zf.datepicker', this._buildCalendar.bind(this));

                this.$element.add(this.$dropdown).off('keydown.zf.dropdown').on('keydown.zf.datepicker', function (e) {

                    var $target = $(this);

                    Foundation.Keyboard.handleKey(e, 'Datepicker', {
                        tab_forward: function tab_forward() {
                            _this.$dropdown.trigger('close');
                        },
                        tab_backward: function tab_backward() {
                            _this.$dropdown.trigger('close');
                        },
                        open: function open() {
                            if ($target.is(_this.$element) && _this.$element.attr('aria-expanded') == 'false') {
                                _this.$dropdown.trigger('open');
                                e.preventDefault();
                            }
                        },
                        close: function close() {
                            _this.$dropdown.trigger('close');
                            _this.$element.focus();
                        }
                    });
                });

                this._triggers();
            }

            /**
             * Overrides the event handler to the body that closes any dropdowns on a click.
             * @function
             * @private
             */

        }, {
            key: '_overrideBodyHandler',
            value: function _overrideBodyHandler() {
                var $body = $(document.body).not(this.$dropdown),
                    _this = this;
                $body.off('click.zf.dropdown').on('click.zf.datepicker', function (e) {
                    if (_this.$element.is(e.target) || _this.$element.find(e.target).length || !$(document).find(e.target).length) {
                        return;
                    }
                    if (_this.$dropdown.find(e.target).length) {
                        return;
                    }
                    _this.$dropdown.trigger('close');
                    $body.off('click.zf.datepicker');
                });
            }
        }, {
            key: '_triggers',
            value: function _triggers() {
                var _this = this;
                this.$dropdown.on('show.zf.dropdown', function (e) {
                    _this.$dropdown.trigger('show.zf.datepicker');
                });
            }

            /**
             * Destroys the datepicker.
             * @function
             */

        }, {
            key: 'destroy',
            value: function destroy() {
                this.$dropdown.remove();
                this.$element.off('.zf.datepicker');

                Foundation.unregisterPlugin(this);
            }
        }]);

        return Datepicker;
    }();

    Datepicker.defaults = {
        /**
         * Number of pixels between the datepicker dropdown and the datepicker field on open.
         * @option
         * @example 1
         */
        vOffset: 10,
        /**
         * Size of the datepicker (timy, small or large)
         * @option
         * @example 'small'
         */
        size: '',
        /**
         * Allows a click on the body to close the datepicker.
         * @option
         * @example false
         */
        closeOnClick: true,
        closeOnSelect: true,
        format: "YYYY-MM-DD",
        locale: 'en',
        weekstart: 0,
        time: false,
        meridiem: false,
        minuteInterval: 15,
        timePickerTemplate: '<div class="foundation-calendar">' + '<div class="calendar-header">' + '<a class="nav-datepicker">{{date}}</a>' + '</div>' + '<div class="timepicker row small-up-{{coll_count}} collapse">{{{timeparts}}}</div>' + '<a class="close-datepicker">Ok</a>' + '</div>',
        timePartSelectorTemplate: '<div class="column {{timepart}}">' + '<a class="button primary expanded {{timepart}}-up"><i class="fa fa-chevron-up fi-arrow-up"></i></a>' + '<div class="timepart-options-container"><div class="options">{{{options}}}</div></div>' + '<a class="button primary expanded {{timepart}}-down disabled"><i class="fa fa-chevron-down fi-arrow-down"></i></a>' + '</div>',
        timeOptionTemplate: '<div class="time-option {{option}}-{{timepart}}">{{option}}</div>'
    };

    // Window exports
    Foundation.plugin(Datepicker, 'Datepicker');
}(jQuery, Mustache, moment);