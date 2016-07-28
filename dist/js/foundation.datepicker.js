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
         * @param {jQuery} input - jQuery object to attach a datepicker to.
         * @param {Object} options - Overrides to the default plugin settings.
         */
        constructor(input, options) {
            this.$input = input;

            if (!this.$input.is('input[type="text"]')) {
                console.warn('The datepicker can only be used on an <input> element with type="text".');
                return;
            }

            this.options = $.extend({}, Datepicker.defaults, this.$input.data(), options);
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

            mm.updateLocale(this.options.locale, {
                week: {dow: this.options.weekstart}
            });
            mm.locale(this.options.locale);

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
            this.$element.attr({
                'id': $id,
                'aria-hidden': 'true',
                'data-yeti-box': $id,
                'data-resize': $id,
                'aria-labelledby': this.$input[0].id || Foundation.GetYoDigits(6, 'datepicker-input')
            });
            this.$input.after(this.$element);

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
            this.preventFalseBodyClick = true;
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

        buildTimePicker() {
            this.preventFalseBodyClick = true;
            this.$element.html('');
            var timeparts = ['hour', 'minute'];
            if (this.options.meridiem) timeparts.push('meridiem');

            var hours = this.buildHours();
            var minutes = this.buildMinutes();
            var meridiems = this.options.meridiem ? this.buildMeridien() : '';

            var timepickerModel = {
                date: this.selectedDate.format('DD MMMM YYYY'),
                coll_count: timeparts.length,
                timeparts: hours+minutes+meridiems,
            };

            var $timepicker = $(mu.render(this.options.timePickerTemplate, timepickerModel));

            $timepicker
                .on('click', '.nav-datepicker', this.buildCalendar.bind(this))
                .on('click', '.hour-up:not(.disabled)', this.addHour.bind(this))
                .on('click', '.hour-down:not(.disabled)', this.subtractHour.bind(this))
                .on('click', '.minute-up:not(.disabled)', this.addMinute.bind(this))
                .on('click', '.minute-down:not(.disabled)', this.subtractMinute.bind(this))
                .on('click', '.meridiem-up:not(.disabled)', this.addMeridiem.bind(this))
                .on('click', '.meridiem-down:not(.disabled)', this.subtractMeridiem.bind(this));

            this.$element.append($timepicker);
        }

        buildHours() {
            var hours = [];
            if (this.options.meridiem) hours = ['11','10','09','08','07','06','05','04','03','02','01','12'];
            else hours = ['23','22','21','20','19','18','17','16','15','14','13','12','11','10','09','08','07','06','05','04','03','02','01','00'];
            return this.buildTimePartSelector(hours, 'hour');
        }

        buildMinutes() {
            var minutes = [];
            for (var i=60-this.options.minuteInterval; i>=0; i = i-this.options.minuteInterval) {
                minutes.push(i < 10 ? '0' + i : '' + i);
            }
            return this.buildTimePartSelector(minutes, 'minute');
        }

        buildMeridien() {
            return this.buildTimePartSelector(['PM','AM'], 'meridiem');
        }

        buildTimePartSelector(items, part) {
            var _this = this;
            var options = '';
            $.each(items, function (index, item) {
                options+= mu.render(_this.options.timeOptionTemplate, {
                    option: item,
                    timepart: part
                });
            });
            return mu.render(this.options.timePartSelectorTemplate, {
                options: options,
                timepart: part
            });
        }

        navigateMonths(e) {
            if ($(e.currentTarget).hasClass('month-nav-next')) this.currentMonth.add(1,'month');
            if ($(e.currentTarget).hasClass('month-nav-previous')) this.currentMonth.subtract(1,'month');
            this.buildCalendar();
            return false;
        }

        selectDay(e) {
            this.$input.val($(e.currentTarget).data('date'));
            this.selectedDate = mm($(e.currentTarget).data('date'), this.options.format);
            this.currentMonth = this.selectedDate.clone().startOf('month');
            if (this.options.time) this.buildTimePicker();
            else this.close();
        }

        addHour(e) {
            this.selectedDate.add(1, 'hours');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.hour-down').removeClass('disabled');
            var option = this.options.meridiem ? this.selectedDate.format('hh') : this.selectedDate.format('HH');
            var $option = $selector.find('.' + option + '-hour');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':first-child')) {
                $(e.target).addClass('disabled');
            }

        }

        subtractHour(e) {
            this.selectedDate.subtract(1, 'hours');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.hour-up').removeClass('disabled');
            var option = this.options.meridiem ? this.selectedDate.format('hh') : this.selectedDate.format('HH');
            var $option = $selector.find('.' + option + '-hour');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':last-child')) {
                $(e.target).addClass('disabled');
            }
        }

        addMinute(e) {
            this.selectedDate.add(this.options.minuteInterval, 'minutes');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.minute-down').removeClass('disabled');
            var option = this.selectedDate.format('mm');
            var $option = $selector.find('.' + option + '-minute');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':first-child')) {
                $(e.target).addClass('disabled');
            }
        }

        subtractMinute(e) {
            this.selectedDate.subtract(this.options.minuteInterval, 'minutes');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.minute-up').removeClass('disabled');
            var option = this.selectedDate.format('mm');
            var $option = $selector.find('.' + option + '-minute');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':last-child')) {
                $(e.target).addClass('disabled');
            }
        }

        addMeridiem(e) {
            this.selectedDate.add(12, 'hours');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.meridiem-down').removeClass('disabled');
            var option = this.selectedDate.format('A');
            var $option = $selector.find('.' + option + '-meridiem');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':first-child')) {
                $(e.target).addClass('disabled');
            }
        }

        subtractMeridiem(e) {
            this.selectedDate.subtract(12, 'hours');
            this.$input.val(this.selectedDate.format(this.options.format));
            var $selector = $(e.target).parent();
            $('.meridiem-up').removeClass('disabled');
            var option = this.selectedDate.format('A');
            var $option = $selector.find('.' + option + '-meridiem');
            var optionDims = Foundation.Box.GetDimensions($option);
            var bottomOffset = (optionDims.height + optionDims.offset.top) - (optionDims.parentDims.height + optionDims.parentDims.offset.top);
            $option.parent().animate({'bottom':bottomOffset + 'px'}, '600', 'swing');
            if ($option.is(':last-child')) {
                $(e.target).addClass('disabled');
            }
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
                    if(_this.preventFalseBodyClick) {
                        _this.preventFalseBodyClick = false;
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
            this.preventFalseBodyClick = false;

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
        time: false,
        meridiem: false,
        minuteInterval: 15,
        calendarTemplate:
            '<div class="foundation-calendar">' +
            '<div class="calendar-header">' +
            '<div class="months-nav">' +
            '<a class="month-nav-previous"><i class="fa fa-chevron-left fi-arrow-left"></i></a>' +
            '<div>{{month}}</div>' +
            '<a class="month-nav-next"><i class="fa fa-chevron-right fi-arrow-right"></i></a>' +
            '</div>' +
            '<div class="weekdays row small-up-7 collapse">{{{weekdays}}}</div>' +
            '</div>' +
            '<div class="days row small-up-7 collapse">{{{days}}}</div>' +
            '</div>',
        weekdayHeaderTemplate:
            '<div class="column day {{dayType}}"><strong>{{day}}</strong></div>',
        dayTemplate:
            '<div class="column"><a class="day {{dayType}}" data-date="{{date}}">{{day}}</a></div>',
        timePickerTemplate:
            '<div class="foundation-calendar">' +
            '<div class="calendar-header">' +
            '<a class="nav-datepicker">{{date}}</a>' +
            '</div>' +
            '<div class="timepicker row small-up-{{coll_count}} collapse">{{{timeparts}}}</div>' +
            '<a class="close-datepicker">Ok</a>' +
            '</div>',
        timePartSelectorTemplate:
            '<div class="column {{timepart}}">' +
            '<a class="button primary expanded {{timepart}}-up"><i class="fa fa-chevron-up fi-arrow-up"></i></a>' +
            '<div class="timepart-options-container"><div class="options">{{{options}}}</div></div>' +
            '<a class="button primary expanded {{timepart}}-down disabled"><i class="fa fa-chevron-down fi-arrow-down"></i></a>' +
            '</div>',
        timeOptionTemplate:
            '<div class="time-option {{option}}-{{timepart}}">{{option}}</div>'
    };

    // Window exports
    Foundation.plugin(Datepicker, 'Datepicker');

}(jQuery, Mustache, moment);
