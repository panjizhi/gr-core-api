import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon, Input, LocaleProvider, message, Pagination, Popconfirm, Table } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined, PERMISSIONS, ROUTES, SetURIParams } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Papers extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            loading: true,
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
            categories: (cb) =>
            {
                this.DirectReadCategories(cb);
            },
            papers: (cb) =>
            {
                this.DirectReadPapers(0, cb);
            }
        }, (err, { permissions, categories, papers }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = papers;

            const rcds = this.FillPapers(records, dict);
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
        AsyncRequest('paper/GetCategories', null, (err, dat) =>
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
            const { dict } = this.state;

            const rcds = this.FillPapers(records, dict);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
            });
        });
    }

    DirectReadPapers(current, cb)
    {
        const { name, category, count } = this.state;
        const pdt = {
            name: name,
            category: category ? category.id : null,
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
                questions: ins.questions ? ins.questions.length : 0,
                duration: ins.duration ? moment.unix(ins.duration + default_timestamp).format('HH:mm:ss') : '无',
                score: ins.score || 0,
                updated_time: ins.updated_time ? moment.unix(ins.updated_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
            };
        });
    }

    onRemoveCategory(instance)
    {
        const pdt = {
            id: instance.id
        };
        AsyncRequest('paper/RemoveCategory', pdt, () =>
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
        AsyncRequest('paper/AddCategory', pdt, () =>
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

    onSearchPaper(text)
    {
        if (!this.state.dict)
        {
            return;
        }

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

    DirectRemovePapers(idArr)
    {
        const pdt = { id: idArr };
        AsyncRequest('paper/RemoveMany', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('删除成功');

            const { current } = this.state;
            this.ReadPapers(current);
        });
    }

    static NewPaper()
    {
        window.open(ROUTES.PAPER_ITEM);
    }

    static EditPaper(record)
    {
        window.open(SetURIParams(ROUTES.PAPER_ITEM, { q: record.id }));
    }

    onRemovePaper(record)
    {
        this.DirectRemovePapers([record.id]);
    }

    onMultiRemovePaper()
    {
        const { selected_keys } = this.state;
        this.DirectRemovePapers(selected_keys);
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
            tree,
            category,
            search,
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
                    open="questions"
                    selected="papers"
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
                                    remove={ detail[PERMISSIONS.REMOVE_CLASS] && category.level > 0 }
                                    append={ detail[PERMISSIONS.CREATE_CLASS] && category.level < 3 }
                                    placeholder={ category.level < 3 ? ((category.level > 0 ? ('为 ' + category.name) : '') + '添加子分类') : null }
                                    onRemove={ this.onRemoveCategory.bind(this) }
                                    onAppend={ this.onAppendCategory.bind(this) }
                                />
                            ) : null
                        }
                    </div>
                    <div className="content">
                        <div className="qtbl-header">
                            <div>
                                <Button type="primary" icon="plus" onClick={ Papers.NewPaper.bind(this) }>新建试卷</Button>
                            </div>
                            <div className="qtbl-search">
                                <Input.Search
                                    value={ search }
                                    placeholder="请输入要搜索的试卷名称"
                                    onChange={ this.onSearchChange.bind(this) }
                                    onSearch={ this.onSearchPaper.bind(this) }
                                    style={ {
                                        width: 360
                                    } }
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
                                    onChange: this.onTableChecked.bind(this)
                                } }
                            >
                                <Table.Column
                                    title="名称"
                                    dataIndex="name"
                                    key="name"
                                    width="20%"
                                    render={ (text, record) => (
                                        <div onClick={ Papers.EditPaper.bind(this, record) }>
                                            <a href="#">{ record.name }</a>
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="分类"
                                    dataIndex="category"
                                    key="category"
                                    width="14%"
                                />
                                <Table.Column
                                    title="题数"
                                    dataIndex="questions"
                                    key="questions"
                                    width="12%"
                                />
                                <Table.Column
                                    title="时长"
                                    dataIndex="duration"
                                    key="duration"
                                    width="12%"
                                />
                                <Table.Column
                                    title="分数"
                                    dataIndex="score"
                                    key="score"
                                    width="12%"
                                />
                                <Table.Column
                                    title="最后更新时间"
                                    dataIndex="updated_time"
                                    key="updated_time"
                                    width="20%"
                                />
                                <Table.Column
                                    title="操作"
                                    key="action"
                                    width="10%"
                                    render={ (text, record) => (
                                        detail[PERMISSIONS.REMOVE_PAPER] ? (
                                            <div>
                                                <Popconfirm
                                                    placement="topRight"
                                                    title={ '是否删除\'' + record.name + '\'？' }
                                                    onConfirm={ this.onRemovePaper.bind(this, record) }
                                                    okText=""
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
                                detail && detail[PERMISSIONS.REMOVE_PAPER] && selected_keys && selected_keys.length
                                    ? (<div>
                                        <Popconfirm
                                            placement="topLeft"
                                            title={ '是否删选中试题？' }
                                            onConfirm={ this.onMultiRemovePaper.bind(this) }
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

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Papers /></LocaleProvider>, document.getElementById('root'));
