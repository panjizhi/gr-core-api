import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input, LocaleProvider, message, Pagination } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import QuestionTable from '../../components/question-table';
import { AsyncRequest, IsUndefined, ROUTES } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Questions extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: false,
            current: 0,
            count: 10,
            total: 0
        };
    }

    componentDidMount()
    {
        async.auto({
            categories: (cb) =>
            {
                this.DirectReadCategories(cb);
            },
            questions: (cb) =>
            {
                this.DirectReadQuestions(0, cb);
            }
        }, (err, { categories, questions }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = questions;

            const rcds = this.FillQuestions(records, dict);
            this.setState({
                dict: dict,
                tree: tree,
                current: 0,
                total: total,
                records: rcds
            });
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
        const pdt = {
            id: record.id
        };
        AsyncRequest('question/RemoveSingle', pdt, () =>
        {
            const { current } = this.state;
            this.ReadQuestions(current);
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
        window.location.href = ROUTES.QUESTION_ITEM;
    }

    render()
    {
        const { loading, tree, category, search, records, current, count, total } = this.state;

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
                                    remove={ category.level > 0 }
                                    append={ category.level < 3 }
                                    placeholder={ category.level < 3 ? ((category.level > 0 ? ('为 ' + category.name) : '') + '添加 ' + ['学科', '章节', '知识点'][category.level]) : null }
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
                                placeholder="请输入要搜索的题目名称"
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchQuestion.bind(this) }
                                style={ {
                                    width: 360
                                } }
                            />
                        </div>
                        <QuestionTable
                            loading={ loading }
                            value={ records }
                            onRemove={ this.onRemoveQuestion.bind(this) }
                            onChange={ this.onTableChange.bind(this) }
                        />
                        <div className="qtbl-footer">
                            <Button type="primary" icon="plus" onClick={ Questions.NewQuestion.bind(this) }>添加新题</Button>
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
