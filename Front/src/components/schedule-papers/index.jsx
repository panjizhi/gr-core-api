import React from 'react';
import { Input, message, Pagination, Table, TreeSelect } from 'antd';
import ScheduleSource from '../../components/schedule-source';
import moment from 'moment';
import { AsyncRequest, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

export default class SchedulePapers extends React.Component
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
            categories: (cb) =>
            {
                this.DirectReadCategories(cb);
            },
            papers: (cb) =>
            {
                this.DirectReadPapers(0, cb);
            }
        }, (err, { categories, papers }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = papers;

            this.setState({
                dict: dict,
                tree: tree,
                total: total,
                records: this.FillPapers(records, dict)
            });
        });
    }

    DirectReadCategories(cb)
    {
        AsyncRequest('paper/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载分类出现错误', undefined, () => this.DirectReadCategories(cb));
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

    ReadPapers(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        this.DirectReadPapers(current, (err, { total, records }) =>
        {
            const { dict, checked_dict } = this.state;

            const rcds = this.FillPapers(records, dict);

            const selectedKeys = [];
            rcds.forEach(ins => ins.id in checked_dict && selectedKeys.push(ins.id));

            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
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

    DirectReadPapers(current, cb)
    {
        const { name, category, count } = this.state;
        const pdt = {
            name: name,
            category: category,
            start: current * count,
            count: count
        };
        AsyncRequest('paper/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载试卷出现错误', undefined, () =>
                {
                    this.DirectReadPapers(current, cb);
                });
            }

            cb(null, dat);
        });
    }

    onCategoryChanged(value)
    {
        this.state.category = value;
        this.state.search = null;
        this.state.name = null;
        this.ReadPapers();

        this.setState({});
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            search: search
        });
    }

    onSearchResult(text)
    {
        const value = text || null;
        if (this.state.name !== value)
        {
            this.state.name = value;
            this.ReadPapers();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadPapers(page - 1);
    }

    onChecked(selectedRowKeys, selectedRows)
    {
        const { checked_dict, records } = this.state;
        records.forEach(ins => delete checked_dict[ins.id]);
        selectedRows.forEach(ins => checked_dict[ins.id] = ins);

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
            tree,
            category,
            loading,
            search,
            records,
            current,
            count,
            total,
            selected_keys,
            checked_dict
        } = this.state;

        const LoopSelect = (dat) =>
        {
            return !dat || !dat.length ? null : dat.map(ins =>
                <TreeSelect.TreeNode
                    value={ ins.id }
                    title={ ins.name }
                    key={ ins.id }
                >{ LoopSelect(ins.children) }</TreeSelect.TreeNode>
            );
        };

        return (
            <div>
                <div className="sch-header">
                    <div>
                        <ScheduleSource
                            value="manual"
                            onChange={ this.onSourceChange.bind(this) }
                        />
                    </div>
                    <div className="sch-manual-selector">
                        <div>
                            <TreeSelect
                                allowClear
                                treeDefaultExpandAll
                                placeholder="请选择试卷分类"
                                value={ category }
                                onChange={ this.onCategoryChanged.bind(this) }
                            >{ LoopSelect(tree) }</TreeSelect>
                        </div>
                        <div>
                            <Input.Search
                                placeholder="请输入试卷名称"
                                value={ search }
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchResult.bind(this) }
                            />
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
