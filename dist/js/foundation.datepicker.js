'use strict';

!function($, mu, mm) {

    /**
     * Datepicker module.
     * @module foundation.datepicker
     * @requires foundation.util.keyboard
     * @requires foundation.util.box
     * @requires foundation.util.triggers
     */

    class Datepicker {
        /**
         * Creates a new instance of a datepicker.
         * @class
         * @param {jQuery} input - jQuery object to make into a datepicker.
         * @param {Object} options - Overrides to the default plugin settings.
         */
        constructor(input, options) {
            this.$input = input;
            this.options = $.extend({}, Datepicker.defaults, this.$input.data(), options);
            mm.updateLocale(this.options.locale, {
                week: {dow: this.options.weekstart}
            });
            mm.locale(this.options.locale);

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
        _init() {
            var $id = Foundation.GetYoDigits(6, 'datepicker');

            this.$input.attr({
                'data-toggle': $id,
                'aria-controls': $id,
                'data-is-focus': false,
                'data-yeti-box': $id,
                'aria-haspopup': true,
                'aria-expanded': false

            });

            this.options.positionClass = this.getPositionClass();
            this.counter = 4;
            this.usedPositions = [];


            this.$element = $('<div class="datepicker-container"></div>');
            this.$input.after(this.$element);

            this.$element.attr({
                'id': $id,
                'aria-hidden': 'true',
                'data-yeti-box': $id,
                'data-resize': $id,
                'aria-labelledby': this.$input[0].id || Foundation.GetYoDigits(6, 'datepicker-input')
            });
            this.weekDaysHeader = this.buildWeekDaysheader();
            this._events();
            this.currentMonth = mm().startOf('month');
            this.selectedDate = mm();
        }

        buildWeekDaysheader() {
            var weekDaysHeader = '';
            var start = this.options.weekstart;// + mm().localeData().firstDayOfWeek();
            for (var i = start; i < (start + 7); i++) {
                var weekday = i;
                if (weekday > 6) weekday = weekday-7;
                var weekdayName = mm().day(weekday).format('ddd');
                weekDaysHeader+= mu.render(this.options.weekdayHeaderTemplate, {
                    dayType: 'weekday-header',
                    day: weekdayName
                });
            }
            return weekDaysHeader;
        }

        buildCalendar() {
            this.$element.html('');
            var date = this.$input.val() == '' ? mm() : mm(this.$input.val(), this.options.format, true);
            var monthViewModel = {
                month: this.currentMonth.format('MMMM YYYY'),
                weekdays: this.weekDaysHeader,
                days: this.buildCalendarDays(date)
            };

            var $calendar = $(mu.render(this.options.calendarTemplate, monthViewModel));

            $calendar
                .on('click', '.months-nav > a', this.navigateMonths.bind(this))
                .on('click', '.day', this.selectDay.bind(this));

            this.$element.append($calendar);
        }

        navigateMonths(e) {
            if ($(e.currentTarget).hasClass('calendar-nav-next')) this.currentMonth.add(1,'month');
            if ($(e.currentTarget).hasClass('calendar-nav-previous')) this.currentMonth.subtract(1,'month');
            this.buildCalendar();
            return false;
        }

        selectDay(e) {
            this.$input.val($(e.currentTarget).data('date'));
            this.selectedDate = mm($(e.currentTarget).data('date'), this.options.format);
            this.currentMonth = this.selectedDate.clone().startOf('month');
            this.close();
        }

        buildCalendarDays(date) {
            var days = '';
            var currentDate = mm(date.format('YYYY-MM-DD'));
            var first = mm(this.currentMonth.format('YYYY-MM-DD'));

            first.startOf('month');
            var last = first.clone();
            last.endOf('month');

            first.startOf('week');
            last.endOf('week');

            for (first; !first.isAfter(last.format('YYYY-MM-DD')); first.add(1, 'day')) {
                var dayType = first.isSame(
                    currentDate.format('YYYY-MM-DD'), 'day')
                    ? 'current'
                    : (first.isSame(this.currentMonth.format('YYYY-MM-DD'), 'month'))
                    ? (first.isSame(mm().format('YYYY-MM-DD'), 'day') ? 'same-month today' : 'same-month')
                    : 'other-month';

                days+= mu.render(this.options.dayTemplate, {
                    dayType: dayType,
                    date: first.format(this.options.format),
                    day: first.date()
                });
            }
            return days;
        }

        /**
         * Helper function to determine current orientation of datepicker pane.
         * @function
         * @returns {String} position - string value of a position class.
         */
        getPositionClass() {
            var verticalPosition = this.$input[0].className.match(/(top|left|right|bottom)/g);
            verticalPosition = verticalPosition ? verticalPosition[0] : '';
            var horizontalPosition = /float-(\S+)\s/.exec(this.$input[0].className);
            horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
            var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;
            return position;
        }

        /**
         * Adjusts the datepicker panes orientation by adding/removing positioning classes.
         * @function
         * @private
         * @param {String} position - position class to remove.
         */
        _reposition(position) {
            this.usedPositions.push(position ? position : 'bottom');
            //default, try switching to opposite side
            if(!position && (this.usedPositions.indexOf('top') < 0)){
                this.$element.addClass('top');
            }else if(position === 'top' && (this.usedPositions.indexOf('bottom') < 0)){
                this.$element.removeClass(position);
            }else if(position === 'left' && (this.usedPositions.indexOf('right') < 0)){
                this.$element.removeClass(position)
                    .addClass('right');
            }else if(position === 'right' && (this.usedPositions.indexOf('left') < 0)){
                this.$element.removeClass(position)
                    .addClass('left');
            }

            //if default change didn't work, try bottom or left first
            else if(!position && (this.usedPositions.indexOf('top') > -1) && (this.usedPositions.indexOf('left') < 0)){
                this.$element.addClass('left');
            }else if(position === 'top' && (this.usedPositions.indexOf('bottom') > -1) && (this.usedPositions.indexOf('left') < 0)){
                this.$element.removeClass(position)
                    .addClass('left');
            }else if(position === 'left' && (this.usedPositions.indexOf('right') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
                this.$element.removeClass(position);
            }else if(position === 'right' && (this.usedPositions.indexOf('left') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
                this.$element.removeClass(position);
            }
            //if nothing cleared, set to bottom
            else{
                this.$element.removeClass(position);
            }
            this.classChanged = true;
            this.counter--;
        }

        /**
         * Sets the position and orientation of the datepicker pane, checks for collisions.
         * Recursively calls itself if a collision is detected, with a new position class.
         * @function
         * @private
         */
        _setPosition() {
            if(this.$input.attr('aria-expanded') === 'false'){ return false; }
            var position = this.getPositionClass(),
                $eleDims = Foundation.Box.GetDimensions(this.$element),
                $inputDims = Foundation.Box.GetDimensions(this.$input),
                _this = this,
                direction = (position === 'left' ? 'left' : ((position === 'right') ? 'left' : 'top')),
                param = (direction === 'top') ? 'height' : 'width',
                offset = (param === 'height') ? this.options.vOffset : this.options.hOffset;



            if(($eleDims.width >= $eleDims.windowDims.width) || (!this.counter && !Foundation.Box.ImNotTouchingYou(this.$element))){
                this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$input, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
                    'width': $eleDims.windowDims.width - (this.options.hOffset * 2),
                    'height': 'auto'
                });
                this.classChanged = true;
                return false;
            }

            this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$input, position, this.options.vOffset, this.options.hOffset));

            while(!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter){
                this._reposition(position);
                this._setPosition();
            }
        }

        /**
         * Adds event listeners to the element utilizing the triggers utility library.
         * @function
         * @private
         */
        _events() {
            var _this = this;
            this.$element.on({
                'open.zf.trigger': this.open.bind(this),
                'close.zf.trigger': this.close.bind(this),
                'toggle.zf.trigger': this.toggle.bind(this),
                'resizeme.zf.trigger': this._setPosition.bind(this)
            });
            this.$input.add(this.$element).on('keydown.zf.datepicker', function(e) {

                Foundation.Keyboard.handleKey(e, 'Datepicker', {
                    tab_forward: function() {
                        _this.close();
                    },
                    tab_backward: function() {
                        _this.close();
                    },
                    open: function() {
                        if ($target.is(_this.$input)) {
                            _this.open();
                            _this.$element.attr('tabindex', -1).focus();
                            e.preventDefault();
                        }
                    },
                    close: function() {
                        _this.close();
                        _this.$input.focus();
                    }
                });
            });
        }

        /**
         * Adds an event handler to the body to close any datepickers on a click.
         * @function
         * @private
         */
        _addBodyHandler() {
            var $body = $(document.body).not(this.$element),
                _this = this;
            $body.off('click.zf.datepicker')
                .on('click.zf.datepicker', function(e){
                    if(_this.$input.is(e.target) || _this.$input.find(e.target).length) {
                        return;
                    }
                    if(_this.$element.find(e.target).length) {
                        return;
                    }
                    _this.close();
                    $body.off('click.zf.datepicker');
                });
        }

        /**
         * Opens the datepicker pane, and fires a bubbling event to close other datepickers.
         * @function
         * @fires Datepicker#closeme
         * @fires Datepicker#show
         */
        open() {
            // var _this = this;
            /**
             * Fires to close other open datepickers
             * @event Datepicker#closeme
             */
            this.$element.trigger('closeme.zf.datepicker', this.$element.attr('id'));
            this.$input.attr({'aria-expanded': true});

            this._setPosition();
            this.$element.addClass('is-open')
                .attr({'aria-hidden': false});

            this.buildCalendar();

            if(this.options.closeOnClick){ this._addBodyHandler(); }

            /**
             * Fires once the datepicker is visible.
             * @event Datepicker#show
             */
            this.$element.trigger('show.zf.datepicker', [this.$element]);
        }

        /**
         * Closes the open datepicker pane.
         * @function
         * @fires Datepicker#hide
         */
        close() {
            if(!this.$element.hasClass('is-open')){
                return false;
            }
            this.$element.removeClass('is-open')
                .attr({'aria-hidden': true});

            this.$input.attr('aria-expanded', false);

            if(this.classChanged){
                var curPositionClass = this.getPositionClass();
                if(curPositionClass){
                    this.$element.removeClass(curPositionClass);
                }
                this.$element
                    .addClass(this.options.positionClass)
                    .css({height: '', width: ''});
                this.classChanged = false;
                this.counter = 4;
                this.usedPositions.length = 0;
            }

            this.currentMonth = this.selectedDate.clone().startOf('month');

            this.$element.trigger('hide.zf.datepicker', [this.$element]);
        }

        /**
         * Toggles the datepicker pane's visibility.
         * @function
         */
        toggle() {
            if(this.$element.hasClass('is-open')){
                this.close();
            }else{
                this.open();
            }
        }

        /**
         * Destroys the datepicker.
         * @function
         */
        destroy() {
            this.$element.off('.zf.trigger').hide();
            this.$input.off('.zf.datepicker');

            Foundation.unregisterPlugin(this);
        }
    }

    Datepicker.defaults = {
        /**
         * Number of pixels between the datepicker pane and the triggering element on open.
         * @option
         * @example 1
         */
        vOffset: 0,
        /**
         * Number of pixels between the datepicker pane and the triggering element on open.
         * @option
         * @example 1
         */
        hOffset: 0,
        /**
         * Class applied to adjust open position. JS will test and fill this in.
         * @option
         * @example 'top'
         */
        positionClass: '',
        /**
         * Allows a click on the body to close the datepicker.
         * @option
         * @example false
         */
        closeOnClick: true,
        format: "YYYY-MM-DD",
        locale: 'en',
        weekstart: 0,
        calendarTemplate:
        '<div class="foudation-calendar">' +
        '<div class="calendar-header">' +
        '<div class="months-nav">' +
        '<a class="calendar-nav-previous">' +
        '<i class="fa fa-chevron-left fi-arrow-left"></i>' +
        '</a>' +
        '<div>{{month}}</div>' +
        '<a class="calendar-nav-next">' +
        '<i class="fa fa-chevron-right fi-arrow-right"></i>' +
        '</a>' +
        '</div>' +
        '<div class="weekdays row small-up-7 collapse">{{{weekdays}}}</div>' +
        '</div>' +
        '<div class="days row small-up-7 collapse">{{{days}}}</div>' +
        '</div>',
        weekdayHeaderTemplate:
            '<div class="column day {{dayType}}"><strong>{{day}}</strong></div>',
        dayTemplate:
            '<div class="column"><a class="day {{dayType}}" data-date="{{date}}">{{day}}</a></div>'
    };

// Window exports
    Foundation.plugin(Datepicker, 'Datepicker');

}(jQuery, Mustache, moment);
