import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon, Input, LocaleProvider, message, Pagination, Popconfirm, Table, TreeSelect } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined, PERMISSIONS, ROUTES, SetURIParams } from '../../public';
import { FillCandidates } from '../../public/utils';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Candidates extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: true,
            current: 0,
            count: 50,
            total: 0,
            checked_dict: {},
            joining: false,
            removing: false
        };
    }

    componentDidMount()
    {
        async.auto({
            permissions: (cb) =>
            {
                this.DirectReadPermissions(cb);
            },
            categories: (cb) =>
            {
                this.DirectReadCategories(cb);
            },
            candidates: (cb) =>
            {
                this.DirectReadCandidates(0, cb);
            }
        }, (err, { permissions, categories, candidates }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = candidates;

            const rcds = FillCandidates(records, dict);
            this.setState({
                loading: false,
                permissions,
                dict: dict,
                tree: tree,
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

    ReadCategories()
    {
        this.DirectReadCategories((err, { dict, tree }) =>
        {
            this.setState({
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
            const { dict } = this.state;

            const rcds = FillCandidates(records, dict);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds,
                selected_keys: undefined
            });
        });
    }

    DirectReadCandidates(current, cb)
    {
        const { name, category, count } = this.state;
        const pdt = {
            name: name,
            category: category ? category.id : null,
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

    onRemoveCategory(instance)
    {
        const pdt = {
            id: instance.id
        };
        AsyncRequest('candidate/RemoveCategory', pdt, () =>
        {
            this.ReadCategories();
            this.onCategorySelected(null);
        });
    }

    onAppendCategory(instance, name)
    {
        const pdt = {
            name: name,
            parent: instance.id
        };
        AsyncRequest('candidate/AddCategory', pdt, () =>
        {
            this.ReadCategories();
            this.onCategorySelected(null);
        });
    }

    onCategorySelected(value)
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

    onSearchCandidate(text)
    {
        if (!this.state.dict)
        {
            return;
        }

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

    onChecked(selectedRowKeys)
    {
        this.setState({ selected_keys: selectedRowKeys });
    }

    onClassesChange(classes)
    {
        this.setState({ classes });
    }

    static ViewCandidate(record)
    {
        window.open(SetURIParams(ROUTES.CANDIDATE_ITEM, { q: record.id }));
    }

    onJoinClasses()
    {
        const { current, selected_keys, classes } = this.state;
        if (!selected_keys || !selected_keys.length || !classes || !classes.length)
        {
            return;
        }

        this.setState({ joining: true });

        const pdt = {
            candidates: selected_keys,
            classes
        };
        AsyncRequest('candidate/SaveClassesMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ joining: false }));
            }

            message.success('加入成功');
            this.ReadCandidates(current);

            this.setState({
                selected_keys: undefined,
                classes: undefined,
                joining: false
            });
        });
    }

    onRemove(record)
    {
        this.DirectRemove([record.id]);
    }

    onMultiRemove()
    {
        const { selected_keys } = this.state;
        this.DirectRemove(selected_keys);
    }

    DirectRemove(idArr)
    {
        this.setState({ removing: true });

        const pdt = { id: idArr };
        AsyncRequest('candidate/RemoveMany', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('删除成功');

            const { current } = this.state;
            this.ReadCandidates(current);

            this.setState({
                selected_keys: undefined,
                classes: undefined,
                removing: false
            });
        });
    }

    render()
    {
        const {
            permissions,
            loading,
            tree,
            category,
            search,
            records,
            current,
            count,
            total,
            selected_keys,
            classes,
            joining,
            removing
        } = this.state;

        const { detail } = permissions || {};

        const LoopSelect = (dat, level) => !dat || !dat.length ?
            null :
            dat.map(ins => <TreeSelect.TreeNode
                value={ ins.id }
                title={ ins.name }
                key={ ins.id }
                disabled={ level <= 1 }
            >
                {
                    LoopSelect(ins.children, level + 1)
                }
            </TreeSelect.TreeNode>);

        return (
            <div>
                <Title />
                <Nav
                    open="candidates"
                    selected="candidates"
                />
                <div className="content-layout">
                    <div className="sidebar">
                        <Categories
                            value={ tree }
                            selected={ category }
                            onSelect={ this.onCategorySelected.bind(this) }
                        />
                        {
                            category ? (
                                <CategoryAppend
                                    value={ category }
                                    remove={ category.level > 0 }
                                    append={ category.level < 2 }
                                    placeholder={ category.level < 2 ? ((category.level > 0 ? ('为' + category.name) : '') + '添加' + ['年级', '班级'][category.level]) : null }
                                    onRemove={ this.onRemoveCategory.bind(this) }
                                    onAppend={ this.onAppendCategory.bind(this) }
                                />
                            ) : null
                        }
                    </div>
                    <div className="content">
                        <div className="qtbl-search">
                            <Input.Search
                                value={ search }
                                placeholder="请输入要搜索的学生名称"
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchCandidate.bind(this) }
                                style={ {
                                    width: 360
                                } }
                            />
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
                                    title={ null }
                                    className="ctbl-avatar-box"
                                    dataIndex="avatar"
                                    key="avatar"
                                    width="10%"
                                    render={ (text, record) => (
                                        <div
                                            className="ctbl-avatar"
                                            onClick={ Candidates.ViewCandidate.bind(this, record) }
                                        >
                                            <img className="ctbl-avatar" src={ record.avatar } />
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="姓名"
                                    dataIndex="name"
                                    key="name"
                                    width="15%"
                                    render={ (text, record) => (
                                        <div onClick={ Candidates.ViewCandidate.bind(this, record) }>
                                            <a href="#">{ record.name }</a>
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="班级"
                                    dataIndex="classes"
                                    key="classes"
                                    width="25%"
                                />
                                <Table.Column
                                    title="OPENID"
                                    dataIndex="openid"
                                    key="openid"
                                    width="25%"
                                />
                                <Table.Column
                                    title="注册时间"
                                    dataIndex="created_time"
                                    key="created_time"
                                    width="15%"
                                />
                                <Table.Column
                                    title="操作"
                                    key="action"
                                    width="10%"
                                    render={ (text, record) => (
                                        detail[PERMISSIONS.REMOVE_CANDIDATE] ? (
                                            <div>
                                                <Popconfirm
                                                    placement="topRight"
                                                    title={ '是否删除此位学生？' }
                                                    onConfirm={ this.onRemove.bind(this, record) }
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
                                selected_keys && selected_keys.length ?
                                    (<div className="cdd-classes">
                                        <div>
                                            <TreeSelect
                                                style={ {
                                                    width: '300px'
                                                } }
                                                placeholder={ `请选择这些学生要加入的班级` }
                                                allowClear
                                                multiple
                                                treeDefaultExpandAll
                                                value={ classes }
                                                onChange={ this.onClassesChange.bind(this) }
                                            >
                                                {
                                                    LoopSelect(tree, 1)
                                                }
                                            </TreeSelect>
                                        </div>
                                        <div>
                                            <Button
                                                type="primary"
                                                icon="plus"
                                                loading={ joining }
                                                disabled={ !(classes && classes.length) }
                                                onClick={ this.onJoinClasses.bind(this) }
                                            >加入</Button>
                                        </div>
                                        {
                                            detail && detail[PERMISSIONS.REMOVE_CANDIDATE] ? (
                                                <div>
                                                    <Popconfirm
                                                        placement="topLeft"
                                                        title={ '是否删选中用户？' }
                                                        onConfirm={ this.onMultiRemove.bind(this) }
                                                        okText="删除"
                                                        cancelText="取消"
                                                    >
                                                        <Button
                                                            icon="delete"
                                                            loading={ removing }
                                                        >删除</Button>
                                                    </Popconfirm>
                                                </div>
                                            ) : null
                                        }
                                    </div>) :
                                    null
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

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Candidates /></LocaleProvider>, document.getElementById('root'));
