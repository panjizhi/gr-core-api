import React from 'react';
import ReactDOM from 'react-dom';
import { DatePicker, LocaleProvider, message, Table, Tree } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class ClassReport extends React.Component
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
            }
        }, (err, { categories }) =>
        {
            const { dict, tree } = categories;

            this.setState({
                dict,
                tree
            });
        });
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

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({ search });
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

    onClassSelected(selectedKeys, e)
    {
        if (!e.selected)
        {
            return;
        }

        const { id, title } = e.selectedNodes[0].props;
        if (!id)
        {
            return;
        }

        this.state._class = {
            id: id,
            name: title,
        };
        this.ReadReport();

        this.setState({});
    }

    ReadReport()
    {
        const { _class, date } = this.state;
        if (!_class || !date)
        {
            return;
        }

        AsyncRequest('candidate/GetClassReport', {
            _class: _class.id,
            date: date.unix()
        }, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({
                    count_report: undefined,
                    diligent_report: undefined,
                    progress_report: undefined
                }));
            }

            dat.count.forEach((ins, i) => ins.key = i);
            dat.diligent.forEach((ins, i) => ins.key = i);
            dat.progress.forEach((ins, i) => ins.key = i);

            this.setState({
                count_report: dat.count,
                diligent_report: dat.diligent,
                progress_report: dat.progress
            });
        });
    }

    render()
    {
        const { _class, tree, date, diligent_report, count_report, progress_report } = this.state;

        const LoopRenderNode = (dat) => !dat || !dat.length ? [] : dat.map(ins => (
            <Tree.TreeNode
                key={ ins.id }
                id={ ins.id }
                title={ ins.name }
            >
                {
                    LoopRenderNode(ins.children)
                }
            </Tree.TreeNode>
        ));

        return (
            <div>
                <Title />
                <Nav
                    open="report"
                    selected="class-report"
                />
                <div className="content-layout">
                    <div className="sidebar">
                        <div className="classes">
                            <Tree
                                defaultExpandedKeys={ ['all'] }
                                selectedKeys={ _class ? [_class.id] : [] }
                                onSelect={ this.onClassSelected.bind(this) }
                            >
                                <Tree.TreeNode
                                    key="all"
                                    title="全部"
                                >
                                    {
                                        LoopRenderNode(tree)
                                    }
                                </Tree.TreeNode>
                            </Tree>
                        </div>
                    </div>
                    <div className="content">
                        <div className="report">
                            <div>
                                <DatePicker
                                    allowClear={ false }
                                    placeholder="请选择日期"
                                    onChange={ this.onDateChecked.bind(this) }
                                />
                            </div>
                            {
                                _class && date ? (<div className="report-list">
                                    <div>
                                        <div>{ `${date.format('YYYY-wo')} 单词进度排行榜 (${_class.name})` }</div>
                                        <div>
                                            <Table
                                                dataSource={ progress_report }
                                                pagination={ false }
                                            >
                                                <Table.Column
                                                    title="排名"
                                                    dataIndex="ranking"
                                                    key="ranking"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="姓名"
                                                    dataIndex="name"
                                                    key="name"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="单词进度"
                                                    dataIndex="progress"
                                                    key="progress"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="目标单词量"
                                                    dataIndex="target"
                                                    key="target"
                                                    width="25%"
                                                />
                                            </Table>
                                        </div>
                                    </div>
                                    <div>
                                        <div>{ `${date.format('YYYY-wo')} 最勤奋排行榜 (${_class.name})` }</div>
                                        <div>
                                            <Table
                                                dataSource={ diligent_report }
                                                pagination={ false }
                                            >
                                                <Table.Column
                                                    title="排名"
                                                    dataIndex="ranking"
                                                    key="ranking"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="姓名"
                                                    dataIndex="name"
                                                    key="name"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="测试次数"
                                                    dataIndex="count"
                                                    key="count"
                                                    width="25%"
                                                />
                                                <Table.Column
                                                    title="平均每天测试次数"
                                                    dataIndex="count_per_day"
                                                    key="count_per_day"
                                                    width="25%"
                                                />
                                            </Table>
                                        </div>
                                    </div>
                                    <div>
                                        <div>{ `${date.format('YYYY-MM-DD')} 测试排行榜 (${_class.name})` }</div>
                                        <div>
                                            <Table
                                                dataSource={ count_report }
                                                pagination={ false }
                                            >
                                                <Table.Column
                                                    title="排名"
                                                    dataIndex="ranking"
                                                    key="ranking"
                                                    width="33%"
                                                />
                                                <Table.Column
                                                    title="姓名"
                                                    dataIndex="name"
                                                    key="name"
                                                    width="33%"
                                                />
                                                <Table.Column
                                                    title="测试次数"
                                                    dataIndex="count"
                                                    key="count"
                                                    width="34%"
                                                />
                                            </Table>
                                        </div>
                                    </div>
                                </div>) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><ClassReport /></LocaleProvider>, document.getElementById('root'));
