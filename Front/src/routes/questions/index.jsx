import React from 'react';
import ReactDOM from 'react-dom';
import { AutoComplete, Button, Icon, Input, LocaleProvider, message, Pagination, Popconfirm, Table } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined, PERMISSIONS, ROUTES, SetURIParams } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Questions extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: true,
            current: 0,
            count: 50,
            total: 0,
            search_data_source: []
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
            questions: (cb) =>
            {
                this.DirectReadQuestions(0, cb);
            }
        }, (err, { permissions, categories, questions }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = questions;

            const rcds = this.FillQuestions(records, dict);
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
        AsyncRequest('question/GetCategories', null, (err, dat) =>
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

    ReadQuestions(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        this.DirectReadQuestions(current, (err, { total, records }) =>
        {
            const { dict } = this.state;

            const rcds = this.FillQuestions(records, dict);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
            });
        });
    }

    DirectReadQuestions(current, cb)
    {
        const { name, category, sorter, count } = this.state;
        const pdt = {
            name: name,
            category: category ? category.id : null,
            sorter: sorter,
            start: current * count,
            count: count
        };
        AsyncRequest('question/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载题目出现错误', undefined, () =>
                {
                    this.DirectReadQuestions(current, cb);
                });
            }

            cb(null, dat);
        });
    }

    FillQuestions(records, dict)
    {
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                name: ins.name,
                subject: ins.subject ? dict[ins.subject].name : '无',
                type: ['单选', '填空', '计算', '写作'][ins.qtype || 0],
                weight: ins.weight,
                score: ins.score,
                knowledges: ins.knowledges && ins.knowledges.length ? ins.knowledges.map(ins => dict[ins].name).join(' ') : '无',
                wrong_rate: `${ins.wrong_rate || 0}%`
            };
        });
    }

    onRemoveCategory(instance)
    {
        const pdt = {
            id: instance.id
        };
        AsyncRequest('question/RemoveCategory', pdt, () =>
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
        AsyncRequest('question/AddCategory', pdt, () =>
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
        this.ReadQuestions();

        this.setState({});
    }

    onSearchAutoComplete(value)
    {
        if (!value)
        {
            return this.setState({ search_data_source: [] });
        }

        const pdt = {
            name: value,
            count: 20
        };
        AsyncRequest('question/GetNameMany', pdt, (err, dat) =>
        {
            this.setState({ search_data_source: err ? [] : dat });
        });
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            search: search
        });
    }

    onSearchQuestion(text)
    {
        if (!this.state.dict)
        {
            return;
        }

        const value = text || null;
        if (this.state.name !== value)
        {
            this.state.name = value;
            this.ReadQuestions();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadQuestions(page - 1);
    }

    onRemoveQuestion(record)
    {
        this.DirectRemoveQuestions([record.id]);
    }

    onMultiRemoveQuestion()
    {
        const { selected_keys } = this.state;
        this.DirectRemoveQuestions(selected_keys);
    }

    DirectRemoveQuestions(idArr)
    {
        const pdt = { id: idArr };
        AsyncRequest('question/RemoveMany', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('删除成功');

            const { current } = this.state;
            this.ReadQuestions(current);

            this.setState({ selected_keys: undefined });
        });
    }

    onTableChange(sorter)
    {
        const fieldMap = {};

        let val = null;
        if (sorter)
        {
            val = {};
            val[fieldMap[sorter.field] || sorter.field] = sorter.order;
        }

        this.state.sorter = val;
        this.ReadQuestions();
    }

    static NewQuestion()
    {
        window.open(ROUTES.QUESTION_ITEM);
    }

    onTableChecked(selectedRowKeys)
    {
        this.setState({ selected_keys: selectedRowKeys });
    }

    static EditQuestion(record)
    {
        let url = ROUTES.QUESTION_ITEM;
        if (record)
        {
            url = SetURIParams(url, { q: record.id });
        }

        window.open(url);
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
            search_data_source,
            selected_keys
        } = this.state;

        const { detail } = permissions || {};

        return (
            <div>
                <Title />
                <Nav
                    open="questions"
                    selected="questions"
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
                                    remove={ detail[PERMISSIONS.REMOVE_SUBJECT] && category.level > 0 }
                                    append={ detail[PERMISSIONS.CREATE_SUBJECT] && category.level < 3 }
                                    placeholder={ category.level < 3 ? ((category.level > 0 ? ('为 ' + category.name) : '') + '添加 ' + ['学科', '章节', '知识点'][category.level]) : null }
                                    onRemove={ this.onRemoveCategory.bind(this) }
                                    onAppend={ this.onAppendCategory.bind(this) }
                                />
                            ) : null
                        }
                    </div>
                    <div className="content">
                        <div className="qtbl-header">
                            <div>
                                <Button
                                    type="primary"
                                    icon="plus"
                                    onClick={ Questions.NewQuestion.bind(this) }
                                >新建试题</Button>
                            </div>
                            <div className="qtbl-search">
                                <AutoComplete
                                    dataSource={ search_data_source }
                                    onSelect={ this.onSearchQuestion.bind(this) }
                                    onSearch={ this.onSearchAutoComplete.bind(this) }
                                >
                                    <Input.Search
                                        value={ search }
                                        placeholder="请输入要搜索的题目名称"
                                        onChange={ this.onSearchChange.bind(this) }
                                        onSearch={ this.onSearchQuestion.bind(this) }
                                        style={ {
                                            width: 360
                                        } }
                                    />
                                </AutoComplete>
                            </div>
                        </div>
                        <div>
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
                                    title="名称"
                                    dataIndex="name"
                                    key="name"
                                    width="25%"
                                    render={ (text, record) => (
                                        <div onClick={ Questions.EditQuestion.bind(this, record) }>
                                            <a href="#">{ record.name }</a>
                                        </div>
                                    ) }
                                />
                                <Table.Column
                                    title="学科"
                                    dataIndex="subject"
                                    key="subject"
                                    width="10%"
                                />
                                <Table.Column
                                    title="题型"
                                    dataIndex="type"
                                    key="type"
                                    width="10%"
                                />
                                <Table.Column
                                    title="难度系数"
                                    dataIndex="weight"
                                    key="weight"
                                    width="10%"
                                />
                                <Table.Column
                                    title="分数"
                                    dataIndex="score"
                                    key="score"
                                    width="10%"
                                />
                                <Table.Column
                                    title="知识点"
                                    dataIndex="knowledges"
                                    key="knowledges"
                                    width="15%"
                                />
                                <Table.Column
                                    title="错误率"
                                    dataIndex="wrong_rate"
                                    key="wrong_rate"
                                    width="10%"
                                    sorter={ true }
                                />
                                <Table.Column
                                    title="操作"
                                    key="action"
                                    width="10%"
                                    render={ (text, record) => (
                                        detail[PERMISSIONS.REMOVE_QUESTION] ? (
                                            <div>
                                                <Popconfirm
                                                    placement="topRight"
                                                    title={ '是否删除\'' + record.name + '\'？' }
                                                    onConfirm={ this.onRemoveQuestion.bind(this, record) }
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
                                detail && detail[PERMISSIONS.REMOVE_QUESTION] && selected_keys && selected_keys.length
                                    ? (<div>
                                        <Popconfirm
                                            placement="topLeft"
                                            title={ '是否删选中试题？' }
                                            onConfirm={ this.onMultiRemoveQuestion.bind(this) }
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

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Questions /></LocaleProvider>, document.getElementById('root'));
