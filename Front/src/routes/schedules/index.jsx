import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon, Input, LocaleProvider, message, Pagination, Popconfirm, Select, Table } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined, ROUTES, SetURIParams, PERMISSIONS } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Schedules extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: true,
            done: null,
            current: 0,
            count: 50,
            total: 0
        };
    }

    componentDidMount()
    {
        async.auto({
            permissions: (cb) =>
            {
                this.DirectReadPermissions(cb);
            },
            schedules: (cb) =>
            {
                this.DirectReadSchedules(0, cb);
            }
        }, (err, { permissions, schedules: { total, records } }) =>
        {
            const rcds = Schedules.FillSchedules(records);
            this.setState({
                loading: false,
                permissions,
                current: 0,
                total: total,
                records: rcds
            });
        });
    }

    DirectReadPermissions(cb)
    {
        AsyncRequest('index/GetCurrentPermissions', null, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.DirectReadPermissions(cb));
            }

            cb(null, dat);
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
                auto: ins.auto,
                paper_name: ins.paper_name,
                full_score: ins.full_score || '无',
                candidate: ins.candidate,
                candidate_name: ins.candidate_name,
                scheduled_time: ins.created_time ? moment.unix(ins.created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前',
                done: ins.isDone,
                score: ins.isDone && ins.score ? ins.score : '无',
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
        window.open(ROUTES.SCHEDULE);
    }

    DirectRemoveSchedules(idArr)
    {
        const pdt = { id: idArr };
        AsyncRequest('schedule/RemoveMany', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('删除成功');

            const { current } = this.state;
            this.ReadSchedules(current);
        });
    }

    onRemoveSchedule(record)
    {
        this.DirectRemoveSchedules([record.id]);
    }

    onMultiRemoveSchedule()
    {
        const { selected_keys } = this.state;
        this.DirectRemoveSchedules(selected_keys);
    }

    onTableChange(pagination, filters, sorter)
    {
        const srt = sorter && sorter.columnKey ? {
            field: sorter.columnKey,
            order: sorter.order === 'ascend' ? 1 : -1
        } : null;

        const fieldMap = {
            done: 'isDone',
            paper: 'paper_name',
            candidate: 'candidate_name'
        };

        let val = null;
        if (srt)
        {
            val = {};
            val[fieldMap[srt.field] || srt.field] = srt.order;
        }

        this.state.sorter = val;
        this.ReadSchedules();
    }

    static ViewPaper(record)
    {
        window.open(SetURIParams(ROUTES.PAPER_ITEM, { q: record.paper }));
    }

    static ViewAutoSchedule(record)
    {
        window.open(SetURIParams(ROUTES.AUTO_SCHEDULE_ITEM, { q: record.auto }));
    }

    static ViewCandidate(record)
    {
        window.open(SetURIParams(ROUTES.CANDIDATE_ITEM, { q: record.candidate }));
    }

    onTableChecked(selectedRowKeys)
    {
        this.setState({ selected_keys: selectedRowKeys });
    }

    render()
    {
        const {
            permissions,
            loading,
            search,
            done,
            records,
            current,
            count,
            total,
            selected_keys
        } = this.state;

        const { detail } = permissions || {};

        return (
            <div>
                <Title />
                <Nav
                    open="schedules"
                    selected="schedules"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qtbl-header">
                            {
                                detail && detail[PERMISSIONS.NEW_SCHEDULE] ? (
                                    <div>
                                        <Button
                                            type="primary"
                                            icon="plus"
                                            onClick={ Schedules.NewSchedule.bind(this) }
                                        >新建派发</Button>
                                    </div>
                                ) : null
                            }
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
                                        placeholder="请输入要搜索的试卷或学生名称"
                                        onChange={ this.onSearchChange.bind(this) }
                                        onSearch={ this.onSearchSchedule.bind(this) }
                                        style={ {
                                            width: 360
                                        } }
                                    />
                                </Input.Group>
                            </div>
                        </div>
                        <div className="rtbl-table">
                            <Table
                                loading={ loading }
                                dataSource={ records }
                                pagination={ false }
                                onChange={ this.onTableChange.bind(this) }
                                rowSelection={ {
                                    selectedRowKeys: selected_keys,
                                    onChange: this.onTableChecked.bind(this)
                                } }
                            >
                                <Table.Column
                                    title="试卷"
                                    dataIndex="paper"
                                    key="paper"
                                    width="15%"
                                    sorter={ true }
                                    render={ (text, record) => (
                                        <div className="stble-paper">
                                            <div onClick={ Schedules.ViewPaper.bind(this, record) }>
                                                <a href="#">{ record.paper_name }</a>
                                            </div>
                                            {
                                                record.auto ?
                                                    (<div onClick={ Schedules.ViewAutoSchedule.bind(this, record) }>
                                                        <Icon type="rocket" />
                                                    </div>) :
                                                    null
                                            }
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="学生"
                                    dataIndex="candidate"
                                    key="candidate"
                                    width="15%"
                                    render={ (text, record) => (
                                        <div onClick={ Schedules.ViewCandidate.bind(this, record) }>
                                            <a href="#">{ record.candidate_name }</a>
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="派发时间"
                                    dataIndex="scheduled_time"
                                    key="scheduled_time"
                                    width="12%"
                                />
                                <Table.Column
                                    title="满分"
                                    dataIndex="full_score"
                                    key="full_score"
                                    width="11%"
                                />
                                <Table.Column
                                    title="得分"
                                    dataIndex="score"
                                    key="score"
                                    width="11%"
                                />
                                <Table.Column
                                    title="是否完成"
                                    dataIndex="done"
                                    key="done"
                                    width="12%"
                                    sorter={ true }
                                    render={ (text, record) => (
                                        <div>
                                            <Icon type={ record.done ? 'check-circle-o' : 'clock-circle-o' } />
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="完成时间"
                                    dataIndex="completed_time"
                                    key="completed_time"
                                    width="12%"
                                />
                                <Table.Column
                                    title="操作"
                                    key="action"
                                    width="12%"
                                    render={ (text, record) => (
                                        detail[PERMISSIONS.REMOVE_SCHEDULE] ? (
                                            <div>
                                                <Popconfirm
                                                    placement="topRight"
                                                    title={ '是否删除此项派发？' }
                                                    onConfirm={ this.onRemoveSchedule.bind(this, record) }
                                                    okText="删除"
                                                    cancelText="取消"
                                                >
                                                    <Icon type="delete" size="small" />
                                                </Popconfirm>
                                            </div>
                                        ) : null
                                    ) }
                                />
                            </Table>
                        </div>
                        <div className="qtbl-footer">
                            {
                                detail && detail[PERMISSIONS.REMOVE_SCHEDULE] && selected_keys && selected_keys.length
                                    ? (<div>
                                        <Popconfirm
                                            placement="topLeft"
                                            title={ '是否删选中派发？' }
                                            onConfirm={ this.onMultiRemoveSchedule.bind(this) }
                                            okText="删除"
                                            cancelText="取消"
                                        >
                                            <Button icon="delete">删除</Button>
                                        </Popconfirm>
                                    </div>)
                                    : null
                            }
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
