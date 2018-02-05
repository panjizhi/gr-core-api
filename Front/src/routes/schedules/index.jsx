import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input, LocaleProvider, message, Pagination, Select } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import ScheduleTable from '../../components/schedule-table';
import { AsyncRequest, IsUndefined, ROUTES } from '../../public';
import '../../public/index.css';
import './index.css';

class Schedules extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: false,
            done: null,
            current: 0,
            count: 10,
            total: 0
        };
    }

    componentDidMount()
    {
        this.DirectReadSchedules(0, (err, { total, records }) =>
        {
            const rcds = Schedules.FillSchedules(records);
            this.setState({
                current: 0,
                total: total,
                records: rcds
            });
        });
    }

    ReadSchedules(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        this.DirectReadSchedules(current, (err, { total, records }) =>
        {
            const rcds = Schedules.FillSchedules(records);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
            });
        });
    }

    DirectReadSchedules(current, cb)
    {
        const { name, done, sorter, count } = this.state;
        const pdt = {
            paper_name: name,
            candidate_name: name,
            done: done,
            sorter: sorter,
            start: current * count,
            count: count
        };
        AsyncRequest('schedule/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载成绩出现错误', undefined, () =>
                {
                    this.DirectReadSchedules(current, cb);
                });
            }

            cb(null, dat);
        });
    }

    static FillSchedules(records)
    {
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                paper: ins.paper,
                paper_name: ins.paper_name,
                candidate: ins.candidate,
                candidate_name: ins.candidate_name,
                scheduled_time: ins.created_time ? moment.unix(ins.created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前',
                done: ins.isDone ? '已完成' : '未完成',
                completed_time: ins.isDone ? (ins.completed_time ? moment.unix(ins.completed_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前') : '无'
            };
        });
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            search: search
        });
    }

    onDoneChange(value)
    {
        this.state.done = value;
        this.ReadSchedules();

        this.setState({});
    }

    onSearchSchedule(text)
    {
        const value = text || null;
        if (this.state.name !== value)
        {
            this.state.name = value;
            this.ReadSchedules();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadSchedules(page - 1);
    }

    static NewSchedule()
    {
        window.location.href = ROUTES.SCHEDULE;
    }

    onRemoveSchedule(record)
    {
        const pdt = {
            id: record.id
        };
        AsyncRequest('schedule/RemoveSingle', pdt, () =>
        {
            const { current } = this.state;
            this.ReadSchedules(current);
        });
    }

    onTableChange(sorter)
    {
        const fieldMap = {
            done: 'isDone',
            paper: 'paper_name',
            candidate: 'candidate_name'
        };

        let val = null;
        if (sorter)
        {
            val = {};
            val[fieldMap[sorter.field] || sorter.field] = sorter.order;
        }

        this.state.sorter = val;
        this.ReadSchedules();
    }

    render()
    {
        const { loading, search, done, records, current, count, total } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="schedules"
                    selected="schedules"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qtbl-search">
                            <Input.Group compact>
                                <Select
                                    value={ done }
                                    onChange={ this.onDoneChange.bind(this) }
                                >
                                    <Select.Option value={ null }>全部</Select.Option>
                                    <Select.Option value={ 1 }>已完成</Select.Option>
                                    <Select.Option value={ 0 }>未完成</Select.Option>
                                </Select>
                                <Input.Search
                                    value={ search }
                                    placeholder="请输入要搜索的试卷或考生名称"
                                    onChange={ this.onSearchChange.bind(this) }
                                    onSearch={ this.onSearchSchedule.bind(this) }
                                    style={ {
                                        width: 360
                                    } }
                                />
                            </Input.Group>
                        </div>
                        <div className="rtbl-table">
                            <ScheduleTable
                                loading={ loading }
                                value={ records }
                                onRemove={ this.onRemoveSchedule.bind(this) }
                                onChange={ this.onTableChange.bind(this) }
                            />
                        </div>
                        <div className="qtbl-footer">
                            <Button type="primary" icon="plus" onClick={ Schedules.NewSchedule.bind(this) }>新建派发</Button>
                            <div className="qtbl-pagination">
                                <Pagination
                                    current={ current + 1 }
                                    pageSize={ count }
                                    total={ total }
                                    showTotal={ total => `共计${total}项` }
                                    onChange={ this.onPageChange.bind(this) }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Schedules /></LocaleProvider>, document.getElementById('root'));
