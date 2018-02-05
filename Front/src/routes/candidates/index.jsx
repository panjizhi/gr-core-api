import React from 'react';
import ReactDOM from 'react-dom';
import { Input, LocaleProvider, message, Pagination } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Categories from '../../components/categories';
import CategoryAppend from '../../components/category-append';
import CandidateTable from '../../components/candidate-table';
import { AsyncRequest, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class Candidates extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: false,
            current: 0,
            count: 8,
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
            candidates: (cb) =>
            {
                this.DirectReadCandidates(0, cb);
            }
        }, (err, { categories, candidates }) =>
        {
            const { dict, tree } = categories;
            const { total, records } = candidates;

            const rcds = this.FillCandidates(records, dict);
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

            const rcds = this.FillCandidates(records, dict);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
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
                return message.error('加载考生出现错误', undefined, () =>
                {
                    this.DirectReadCandidates(current, cb);
                });
            }

            cb(null, dat);
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
                grade: ins.grade ? dict[ins.grade].name : '无',
                class: ins.class ? dict[ins.class].name : '无',
                openid: ins.openid,
                created_time: ins.createTime ? moment(ins.createTime).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
            };
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

    render()
    {
        const { loading, tree, category, search, records, current, count, total } = this.state;

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
                                placeholder="请输入要搜索的考生名称"
                                onChange={ this.onSearchChange.bind(this) }
                                onSearch={ this.onSearchCandidate.bind(this) }
                                style={ {
                                    width: 360
                                } }
                            />
                        </div>
                        <CandidateTable
                            loading={ loading }
                            value={ records }
                        />
                        <div className="qtbl-footer">
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
