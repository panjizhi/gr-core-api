import React from 'react';
import { Icon, Popconfirm, Cascader } from 'antd';
import moment from 'moment';
import { ROUTES, SetURIParams } from '../../public';
import './index.css';

export default class Calendar extends React.Component
{
    constructor(props)
    {
        super(props);

        const today = moment();

        const months = [];
        for (let i = 0; i < 12; ++i)
        {
            months.push({
                value: i,
                label: (i + 1) + '月'
            });
        }

        const options = [];
        const year = today.year();
        for (let i = year - 4; i <= year; ++i)
        {
            options.push({
                value: i,
                label: i + '年',
                children: months
            })
        }

        const month = moment([today.year(), today.month()]);
        this.state = {
            options,
            month: month,
            days: Calendar.GetDays(month),
            cell_height: props['cell-height'],
            schedules: props.schedules
        };
    }

    componentDidMount()
    {
        const { days } = this.state;
        this.onDateChange(days.begin, days.end);
    }

    componentWillReceiveProps(nextProps)
    {
        const { schedules } = this.state;
        if (nextProps.schedules !== schedules)
        {
            this.setState({ schedules: nextProps.schedules });
        }
    }

    onMonthChange(value)
    {
        const month = moment([+(value[0]), +(value[1])]);
        const days = Calendar.GetDays(month);

        this.onDateChange(days.begin, days.end);

        this.setState({
            month,
            days
        });
    }

    onDateChange(begin, end)
    {
        const { onDateChange } = this.props;
        onDateChange && onDateChange(begin, end);
    }

    onChecked(value)
    {
        this.onDateChecked(value);
        this.setState({ checked: value.unix() });
    }

    onDateChecked(value)
    {
        const { onDateChecked } = this.props;
        onDateChecked && onDateChecked(value);
    }

    static GetDays(month)
    {
        const weeks = [];
        let days = [];

        let index = 0;
        const start = moment(month).subtract(month.day() || 7, 'd');
        let d = moment(start);
        do
        {
            days.push({
                date: moment(d),
                format: d.format('YYYY-MM-DD'),
                out: d.month() === month.month() ? 0 : 1
            });

            if (!(++index % 7))
            {
                weeks.push(days);
                if (d.year() > month.year() || d.month() > month.month())
                {
                    break;
                }

                days = [];
            }

            d = d.add(1, 'd');
        }
        while (1);

        return {
            begin: start,
            end: d,
            weeks
        };
    }

    render()
    {
        const { options, month, days, checked, cell_height, schedules } = this.state;

        const IterateDays = () =>
        {
            const { weeks } = days;
            return weeks.map(w => (<div key={ w[0].date.unix() }>{
                w.map(d =>
                {
                    const date = d.date;
                    const key = date.unix();
                    return (<div
                        className={ 'cal-day' + (key === checked ? ' checked' : '') + (d.out ? ' out' : '') }
                        key={ key }
                        style={ { height: cell_height } }
                        onClick={ this.onChecked.bind(this, date) }
                    >
                        <div>{ date.date() }</div>
                        <div>{ schedules ? schedules[date.format('YYYY-MM-DD')] : null }</div>
                    </div>);
                })
            }</div>));
        };

        return (<div>
            <div className="cal-date-selector">
                <Cascader
                    allowClear={ false }
                    defaultValue={ [month.year(), month.month()] }
                    options={ options }
                    onChange={ this.onMonthChange.bind(this) }
                />
            </div>
            <div className="cal-days">
                <div className="cal-week">
                    <div>日</div>
                    <div>一</div>
                    <div>二</div>
                    <div>三</div>
                    <div>四</div>
                    <div>五</div>
                    <div>六</div>
                </div>
                {
                    IterateDays()
                }
            </div>
        </div>)
    }
}
