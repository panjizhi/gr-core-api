import React from 'react';
import ReactDOM from 'react-dom';
import { Input, LocaleProvider, Pagination, TreeSelect, Table } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import Calendar from '../../components/calendar';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';
import { message } from "antd/lib/index";
import PaperTable from "../../components/paper-table";

class CandidateReport extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            count: 50,
            current: 0,
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

            this.setState({
                dict,
                tree,
                current: 0,
                total,
                candidates: this.FillCandidates(records, dict)
            });
        });
    }

    FillCandidates(records, dict)
    {
        return records.map(ins => ({
            id: ins._id,
            key: ins._id,
            avatar: ins.avatarUrl,
            name: ins.name,
            classes: ins.classes ? ins.classes.map(ins => dict[ins].name).join('，') : '无',
            registered_time: ins.createTime ? moment(ins.createTime).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
        }));
    }

    DirectReadCategories(cb)
    {
        AsyncRequest('candidate/GetCategories', null, (err, dat) =>
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
                dict,
                tree
            });
        });
    }

    DirectReadCandidates(current, cb)
    {
        const { name, category, count } = this.state;
        const pdt = {
            name,
            category,
            start: current * count,
            count
        };
        AsyncRequest('candidate/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.DirectReadCandidates(current, cb));
            }

            cb(null, dat);
        });
    }

    ReadCandidates(current)
    {
        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({ loading: true });

        this.DirectReadCandidates(current, (err, { total, records }) =>
        {
            const { dict } = this.state;

            this.setState({
                loading: false,
                current: current,
                total: total,
                candidates: this.FillCandidates(records, dict)
            });
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
        this.setState({ search });
    }

    onSearch(text)
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

    onChecked(ins)
    {
        this.state.candidate_checked = ins.key;
        this.state.candidate_name = ins.name;
        this.ReadCalendar();
        this.ReadReport();

        this.setState({});
    }

    onDateChange(begin, end)
    {
        this.state.begin = begin;
        this.state.end = end;
        this.ReadCalendar();

        this.setState({});
    }

    onDateChecked(date)
    {
        this.state.date = date;
        this.ReadReport();

        this.setState({});
    }

    ReadCalendar()
    {
        const { candidate_checked, begin, end } = this.state;
        if (!candidate_checked || !begin || !end)
        {
            return;
        }

        AsyncRequest('candidate/GetCalendar', {
            candidate: candidate_checked,
            begin: begin.unix(),
            end: end.unix()
        }, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ results: undefined }));
            }

            this.setState({ results: dat });
        });
    }

    ReadReport()
    {
        const { default_timestamp, candidate_checked, date } = this.state;
        if (!candidate_checked || !date)
        {
            return;
        }

        AsyncRequest('candidate/GetDateReport', {
            candidate: candidate_checked,
            date: date.unix()
        }, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ report: undefined }));
            }

            const papers = [];

            let current = null;
            dat.forEach((ins, i) =>
            {
                const p = {
                    key: i.toString(),
                    cross: 1,
                    category: ins.category,
                    category_name: ins.category_name || '无',
                    paper: ins.name,
                    count: ins.count,
                    duration: ins.duration ? moment.unix(ins.duration + default_timestamp).format('HH:mm:ss') : '无',
                    full_score: ins.full_score,
                    score: ins.score
                };

                if (current && current.category === p.category)
                {
                    ++current.cross;
                    p.cross = 0;
                }
                else if (!current || current.category !== p.category)
                {
                    current = p;
                }

                papers.push(p);
            });

            this.setState({ report: papers });
        });
    }

    render()
    {
        const {
            tree,
            category,
            search,
            candidates,
            current,
            count,
            total,
            candidate_checked,
            candidate_name,
            results,
            begin,
            end,
            date,
            report
        } = this.state;

        const schedules = {};
        if (results && begin && end)
        {
            let t = begin.unix();
            let e = end.unix();
            let n = moment().unix();
            for (; 1;)
            {
                const fmt = moment.unix(t).format('YYYY-MM-DD');
                const r = results[fmt];
                schedules[fmt] = (<div className={ 'cal-cell-fill' + (r && r.length >= 3 ? ' highlight' : '') } />);

                t += 24 * 60 * 60;
                if (t > n || t > e)
                {
                    break;
                }
            }
        }

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
                <Title />
                <Nav
                    open="report"
                    selected="candidate-report"
                />
                <div className="content-layout">
                    <div className="sidebar">
                        <div className="candidates">
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
                                        onSearch={ this.onSearch.bind(this) }
                                    />
                                </div>
                            </div>
                            <div className="candidate-list">
                                {
                                    candidates && candidates.length ? candidates.map(ins => (
                                        <div
                                            className={ 'cdd-item' + (ins.key === candidate_checked ? ' checked' : '') }
                                            key={ ins.key }
                                            onClick={ this.onChecked.bind(this, ins) }
                                        >
                                            <div className="cdd-avatar">
                                                <img src={ ins.avatar } />
                                            </div>
                                            <div className="cdd-detail">
                                                <div>
                                                    <div>{ ins.name }</div>
                                                    <div className="cdd-light">{ ins.registered_time }</div>
                                                </div>
                                                <div>
                                                    <div>{ ins.classes }</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (<div>暂无记录</div>)
                                }
                            </div>
                            <div className="sch-pagination">
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
                    <div className="content">
                        <div className="report">
                            <div>
                                <Calendar
                                    cell-height={ '50px' }
                                    schedules={ schedules }
                                    onDateChange={ this.onDateChange.bind(this) }
                                    onDateChecked={ this.onDateChecked.bind(this) }
                                />
                            </div>
                            {
                                candidate_checked && date ?
                                    (<div className="report-single">
                                        <div>{ date.format('YYYY-MM-DD') } { candidate_name } 测试日报</div>
                                        <div>
                                            <Table
                                                dataSource={ report }
                                                pagination={ false }
                                            >
                                                <Table.Column
                                                    dataIndex="category_name"
                                                    key="category_name"
                                                    width="16%"
                                                    render={ (text, record) => ({
                                                        children: (<div>{ record.category_name }</div>),
                                                        props: { rowSpan: record.cross }
                                                    }) }
                                                />
                                                <Table.Column
                                                    title="试卷"
                                                    dataIndex="paper"
                                                    key="paper"
                                                    width="20%"
                                                />
                                                <Table.Column
                                                    title="次数"
                                                    dataIndex="count"
                                                    key="count"
                                                    width="16%"
                                                />
                                                <Table.Column
                                                    title="时长"
                                                    dataIndex="duration"
                                                    key="duration"
                                                    width="16%"
                                                />
                                                <Table.Column
                                                    title="总分"
                                                    dataIndex="full_score"
                                                    key="full_score"
                                                    width="16%"
                                                />
                                                <Table.Column
                                                    title="成绩"
                                                    dataIndex="score"
                                                    key="score"
                                                    width="16%"
                                                />
                                            </Table>
                                        </div>
                                    </div>) :
                                    null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><CandidateReport /></LocaleProvider>, document.getElementById('root'));
