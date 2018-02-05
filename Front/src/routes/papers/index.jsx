import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input, Layout, LocaleProvider, message, Pagination } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import PaperTable from '../../components/paper-table';
import { AsyncRequest, IsUndefined, ROUTES } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

const { Header, Content, Sider } = Layout;

class Papers extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
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
            papers: (cb) =>
            {
                this.DirectReadPapers(0, cb);
            }
        }, (err, { categories, papers }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = papers;

            const rcds = this.FillPapers(records, dict);
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

    onRemovePaper(record)
    {
        const pdt = {
            id: record.id
        };
        AsyncRequest('paper/RemoveSingle', pdt, () =>
        {
            const { current } = this.state;
            this.ReadPapers(current);
        });
    }

    static NewPaper()
    {
        window.location.href = ROUTES.PAPER_ITEM;
    }

    render()
    {
        const { loading, tree, category, search, records, current, count, total } = this.state;

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
                                    remove={ category.level > 0 }
                                    append={ category.level < 3 }
                                    placeholder={ category.level < 3 ? ((category.level > 0 ? ('为 ' + category.name) : '') + '添加子分类') : null }
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
                                placeholder="请输入要搜索的试卷名称"
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchPaper.bind(this) }
                                style={ {
                                    width: 360
                                } }
                            />
                        </div>
                        <PaperTable
                            loading={ loading }
                            value={ records }
                            onRemove={ this.onRemovePaper.bind(this) }
                        />
                        <div className="qtbl-footer">
                            <Button type="primary" icon="plus" onClick={ Papers.NewPaper.bind(this) }>添加新卷</Button>
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
