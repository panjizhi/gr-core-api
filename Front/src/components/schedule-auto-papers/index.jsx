import React from 'react';
import { message, Pagination, Select, Table } from 'antd';
import ScheduleSource from '../../components/schedule-source';
import moment from 'moment';
import { AsyncRequest, DEFAULT_ERR_MESSAGE } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

export default class ScheduleAutoPapers extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            loading: false,
            count: 50,
            current: 0,
            total: 0,
            checked_dict: {}
        };
    }

    componentDidMount()
    {
        async.auto({
            categories: (cb) => this.DirectReadCategories(cb),
            auto: (cb) => this.DirectReadAuto(cb)
        }, (err, { categories, auto }) =>
        {
            const { dict } = categories;

            auto.forEach(ins =>
            {
                ins.flow = this.FillPapers(ins.flow, dict);
                ins.flow.forEach(p =>
                {
                    p.key = `${ins._id}_${p.id}`;
                    p.auto = ins._id;
                });
            });

            console.log(auto);

            const adict = {};
            auto.forEach(ins => adict[ins._id] = ins);

            this.setState({
                auto,
                auto_dict: adict
            });

            if (auto.length)
            {
                this.onAutoChange(auto[0]._id);
            }
        });
    }

    DirectReadCategories(cb)
    {
        AsyncRequest('paper/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.DirectReadCategories(cb));
            }

            const dict = {};
            dat.forEach(ins => dict[ins._id] = {
                id: ins._id,
                name: ins.name,
                parent: ins.parent,
                children: []
            });

            const tree = [];
            Object.values(dict).forEach(ins => ins.parent ? dict[ins.parent].children.push(ins) : tree.push(ins));

            cb(null, {
                dict: dict,
                tree: tree
            });
        });
    }

    FillPapers(records, dict)
    {
        const { default_timestamp } = this.state;
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                name: ins.name,
                category: ins.category ? dict[ins.category].name : '无',
                duration: ins.duration ? moment.unix(ins.duration + default_timestamp).format('HH:mm:ss') : '无',
                score: ins.score || '无'
            };
        });
    }

    DirectReadAuto(cb)
    {
        const pdt = { detail: 1, };
        AsyncRequest('schedule/GetAutoMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.DirectReadAuto(current, cb));
            }

            cb(null, dat);
        });
    }

    onAutoChange(value)
    {
        const { auto_dict } = this.state;

        this.state.auto_chosen = auto_dict[value];
        this.state.total = this.state.auto_chosen.flow.length;
        this.onPageChange(1);
    }

    GetPaperSection(auto, current)
    {
        const { count } = this.state;
        const start = current * count;
        return auto.flow.slice(start, start + count);
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        const { auto_chosen } = this.state;
        const index = page - 1;
        this.setState({
            records: this.GetPaperSection(auto_chosen, index),
            current: index,
            chs_selected_keys: null,
            chs_selected: null
        });
    }

    onChecked(selectedRowKeys, selectedRows)
    {
        const { checked_dict, records } = this.state;
        records.forEach(ins => delete checked_dict[ins.key]);
        selectedRows.forEach(ins => checked_dict[ins.key] = ins);

        this.props.onChecked(checked_dict);

        this.setState({
            selected_keys: selectedRowKeys
        });
    }

    onSourceChange(value)
    {
        const { onSourceChange } = this.props;
        onSourceChange && onSourceChange(value);
    }

    render()
    {
        const {
            auto,
            auto_chosen,
            loading,
            records,
            current,
            count,
            total,
            selected_keys,
            checked_dict
        } = this.state;

        return (
            <div>
                <div className="sch-header">
                    <div>
                        <ScheduleSource
                            value="auto"
                            onChange={ this.onSourceChange.bind(this) }
                        />
                    </div>
                    <div className="sch-manual-selector">
                        <div>
                            <Select
                                placeholder="选择一项自动派发流程"
                                value={ auto_chosen ? auto_chosen._id : undefined }
                                onChange={ this.onAutoChange.bind(this) }
                            >
                                {
                                    auto && auto.length ?
                                        auto.map(ins => (<Select.Option
                                            key={ ins._id }
                                            value={ ins._id }
                                        >{ ins.name }</Select.Option>)) :
                                        null
                                }
                            </Select>
                        </div>
                    </div>
                </div>
                <div>
                    <Table
                        loading={ loading }
                        dataSource={ records }
                        pagination={ false }
                        rowSelection={ {
                            selectedRowKeys: selected_keys,
                            onChange: this.onChecked.bind(this)
                        } }
                    >
                        <Table.Column
                            title="名称"
                            dataIndex="name"
                            key="name"
                            width="30%"
                        />
                        <Table.Column
                            title="分类"
                            dataIndex="category"
                            key="category"
                            width="30%"
                        />
                        <Table.Column
                            title="时长"
                            dataIndex="duration"
                            key="duration"
                            width="25%"
                        />
                        <Table.Column
                            title="满分"
                            dataIndex="score"
                            key="score"
                            width="15%"
                        />
                    </Table>
                </div>
                <div className="sch-pagination">
                    <div>已选择{ Object.keys(checked_dict).length }项</div>
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
        )
    }
}
