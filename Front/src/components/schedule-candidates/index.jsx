import React from 'react';
import { Input, message, Pagination, Table, TreeSelect } from 'antd';
import moment from 'moment';
import { AsyncRequest, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

export default class ScheduleCandidates extends React.Component
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
            checked_dict: {},
        };
    }

    componentDidMount()
    {
        async.auto({
            categories: (cb) =>
            {
                this.DirectReadCategories(cb);
            },
            candidates: (cb) =>
            {
                this.DirectReadCandidates(0, cb);
            }
        }, (err, { categories, candidates }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = candidates;

            this.setState({
                dict: dict,
                tree: tree,
                total: total,
                records: this.FillCandidates(records, dict)
            });
        });
    }

    DirectReadCategories(cb)
    {
        AsyncRequest('candidate/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载分类出现错误', undefined, () =>
                {
                    this.DirectReadCategories(cb);
                });
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

    ReadCandidates(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        this.DirectReadCandidates(current, (err, { total, records }) =>
        {
            const { dict, checked_dict } = this.state;

            const rcds = this.FillCandidates(records, dict);

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

    FillCandidates(records, dict)
    {
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                avatar: ins.avatarUrl,
                name: ins.name,
                classes: ins.classes ? ins.classes.map(ins => dict[ins].name).join('，') : '无',
                registered_time: ins.createTime ? moment(ins.createTime).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
            };
        });
    }

    DirectReadCandidates(current, cb)
    {
        const { name, category, count } = this.state;
        const pdt = {
            name: name,
            category: category,
            start: current * count,
            count: count
        };
        AsyncRequest('candidate/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载学生出现错误', undefined, () =>
                {
                    this.DirectReadCandidates(current, cb);
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
        this.ReadCandidates();

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
            this.ReadCandidates();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadCandidates(page - 1);
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
                <div className="sch-selector">
                    <div>
                        <TreeSelect
                            allowClear
                            treeDefaultExpandAll
                            placeholder="请选择班级"
                            value={ category }
                            onChange={ this.onCategoryChanged.bind(this) }
                        >{ LoopSelect(tree) }</TreeSelect>
                    </div>
                    <div>
                        <Input.Search
                            placeholder="请输入学生名称"
                            value={ search }
                            onChange={ this.onSearchChange.bind(this) }
                            onSearch={ this.onSearchResult.bind(this) }
                        />
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
                            title=""
                            className="ctbl-avatar-box"
                            dataIndex="avatar"
                            key="avatar"
                            width="10%"
                            render={ (text, record) => (
                                <div className="ctbl-avatar">
                                    <img className="ctbl-avatar" src={ record.avatar } />
                                </div>
                            ) }
                        />
                        <Table.Column
                            title="姓名"
                            dataIndex="name"
                            key="name"
                            width="25%"
                        />
                        <Table.Column
                            title="班级"
                            dataIndex="classes"
                            key="classes"
                            width="40%"
                        />
                        <Table.Column
                            title="注册时间"
                            dataIndex="registered_time"
                            key="registered_time"
                            width="25%"
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
