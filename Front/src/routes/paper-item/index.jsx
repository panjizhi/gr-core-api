import React from 'react';
import ReactDOM from 'react-dom';
import {
    Button,
    Divider,
    Icon,
    Input,
    LocaleProvider,
    message,
    Pagination,
    Switch,
    Table,
    TimePicker,
    TreeSelect
} from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import PaperResults from '../../components/paper-results';
import { AsyncRequest, GetURIParams, IsUndefined, ROUTES, DEFAULT_ERR_MESSAGE } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

const { TreeNode } = TreeSelect;

class PaperItem extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            duration: defaultTime,
            loading: false,
            count: 50,
            qus_current: 0,
            qus_total: 0,
            chs_current: 0,
            chs_total: 0,
            score: 1,
            submitting: false,
            upms: GetURIParams()
        };
    }

    componentDidMount()
    {
        async.auto({
            paper: (cb) =>
            {
                this.state.upms.q ? this.ReadPaper(cb) : cb();
            },
            categories: (cb) =>
            {
                this.ReadCategories(cb);
            },
            question_categories: (cb) =>
            {
                this.ReadQuestionCategories(cb);
            },
            questions: (cb) =>
            {
                this.DirectReadQuestions(0, cb);
            }
        }, (err, {
            paper,
            categories: cat,
            question_categories: qcat,
            questions
        }) =>
        {
            const state = {
                cat_dict: cat.dict,
                cat_tree: cat.tree,
                qus_cat_dict: qcat.dict,
                qus_cat_tree: qcat.tree,
                loading: false,
                questions: PaperItem.FillQuestions(questions.records),
                qus_total: questions.total
            };

            let score = 0;
            let chs_total = 0;
            let disorder = false;
            if (paper)
            {
                state.pid = paper._id;
                state.name = paper.name;
                state.category = paper.category;
                if (paper.duration)
                {
                    state.duration = moment.unix(this.state.default_timestamp + paper.duration);
                }

                if (paper.questions && paper.questions.length)
                {
                    score = PaperItem.GetQuestionScore(paper.questions);
                    state.question_chosen = PaperItem.FillQuestions(paper.questions);
                    state.chs_dict = PaperItem.RecombineQuestions(state.question_chosen);

                    chs_total = state.question_chosen.length;
                    state.chs_question_display = this.GetQuestionSection(state.question_chosen, 0);
                }

                disorder = !!paper.disorder;
            }

            state.score = score;
            state.disorder = disorder;
            state.chs_total = chs_total;
            state.question_chosen = state.question_chosen || [];
            state.chs_dict = state.chs_dict || {};

            this.setState(state);
        });
    }

    ReadPaper(cb)
    {
        const { upms } = this.state;

        const pdt = {
            id: upms.q
        };
        AsyncRequest('paper/GetSingle', pdt, (err, dat) =>
        {
            if (err || !dat)
            {
                delete upms.q;
                message.error('读取试卷失败');

                return cb();
            }

            cb(null, dat);
        });
    }

    ReadCategories(cb)
    {
        AsyncRequest('paper/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载分类出现错误', undefined, () =>
                {
                    this.ReadCategories(cb);
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
            })
        });
    }

    ReadQuestionCategories(cb)
    {
        AsyncRequest('question/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载分类出现错误', undefined, () =>
                {
                    this.ReadQuestionCategories(cb);
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
            })
        });
    }

    DirectReadQuestions(current, cb)
    {
        const { qus_name, qus_category, count } = this.state;
        const pdt = {
            name: qus_name,
            category: qus_category,
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
            const rcds = PaperItem.FillQuestions(records);
            this.setState({
                loading: false,
                qus_current: current,
                qus_total: total,
                questions: rcds
            });
        });
    }

    static FillQuestions(records)
    {
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                name: ins.name,
                type: ['单选', '填空', '计算', '写作'][ins.qtype || 0],
                score: ins.score,
            };
        });
    }

    static RecombineQuestions(records)
    {
        const dict = {};
        records.forEach((ins, i) => dict[ins.id] = i);
        return dict;
    }

    GetQuestionSection(records, current)
    {
        const { count } = this.state;
        const start = current * count;
        return records.slice(start, start + count);
    }

    static GetQuestionScore(records)
    {
        return records.reduce((sum, ins) => sum + ins.score, 0);
    }

    onQTypeChange(e)
    {
        const value = e.target.value;
        this.setState({
            qtype: value
        });
    }

    onNameChanged(e)
    {
        this.setState({
            name: e.target.value
        })
    }

    onCategoryChanged(value)
    {
        this.setState({
            category: value
        });
    }

    onQuestionCategoryChanged(value)
    {
        this.state.qus_category = value;
        this.state.qus_search = null;
        this.state.qus_name = null;
        this.ReadQuestions();

        this.setState({});
    }

    onDurationChange(value)
    {
        this.setState({
            duration: value
        });
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            qus_search: search
        });
    }

    onSearchQuestion(text)
    {
        const value = text || null;
        const { qus_name } = this.state;
        if (value !== qus_name)
        {
            this.state.qus_name = value;
            this.ReadQuestions();

            this.setState({
                qus_selected_keys: null,
                qus_selected: null
            });
        }
    }

    onQuestionPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadQuestions(page - 1);

        this.setState({
            qus_selected_keys: null,
            qus_selected: null
        });
    }

    onChosenPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        const { question_chosen } = this.state;
        const index = page - 1;
        this.setState({
            chs_question_display: this.GetQuestionSection(question_chosen, index),
            chs_current: index,
            chs_selected_keys: null,
            chs_selected: null
        });
    }

    onQuestionChecked(selectedRowKeys, selectedRows)
    {
        this.setState({
            qus_selected_keys: selectedRowKeys,
            qus_selected: selectedRows
        });
    }

    onChosenChecked(selectedRowKeys, selectedRows)
    {
        this.setState({
            chs_selected_keys: selectedRowKeys,
            chs_selected: selectedRows
        });
    }

    onAddQuestion()
    {
        const { qus_selected, question_chosen, chs_dict, chs_current } = this.state;
        let start = question_chosen.length;
        qus_selected.forEach(ins =>
        {
            if (ins.id in chs_dict)
            {
                return true;
            }

            question_chosen.push(ins);
            chs_dict[ins.id] = start++;
        });

        this.setState({
            chs_total: question_chosen.length,
            chs_question_display: this.GetQuestionSection(question_chosen, chs_current),
            score: PaperItem.GetQuestionScore(question_chosen),
            qus_selected_keys: null,
            qus_selected: null
        });
    }

    onRemoveQuestion()
    {
        const { chs_selected_keys, question_chosen, chs_dict, chs_current } = this.state;
        chs_selected_keys.forEach(ins => delete question_chosen[chs_dict[ins]]);

        const nchs = [];
        question_chosen.forEach(ins => ins && nchs.push(ins));

        this.setState({
            question_chosen: nchs,
            chs_dict: PaperItem.RecombineQuestions(nchs),
            chs_total: nchs.length,
            chs_question_display: this.GetQuestionSection(nchs, chs_current),
            score: PaperItem.GetQuestionScore(nchs),
            chs_selected_keys: null,
            chs_selected: null
        });
    }

    onDisorderChange(disorder)
    {
        this.setState({ disorder });
    }

    onSavePaper()
    {
        const { pid, name, category, question_chosen, score, duration, disorder, default_timestamp } = this.state;
        if (!name)
        {
            return message.info('请填写试卷名称');
        }

        this.setState({ submitting: true });

        const pdt = {
            id: pid,
            name: name,
            category: category,
            questions: question_chosen && question_chosen.length ? question_chosen.map(ins => ins.id) : null,
            score: score,
            duration: duration.unix() - default_timestamp,
            disorder: disorder ? 1 : 0
        };
        AsyncRequest('paper/SaveSingle', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ submitting: false }));
            }

            message.success('保存成功', undefined, () => window.location.href = ROUTES.PAPERS);
        });
    }

    render()
    {
        const {
            pid,
            name,
            cat_tree,
            category,
            duration,
            qus_cat_tree,
            qus_category,
            qus_search,
            loading,
            count,
            questions,
            qus_selected_keys,
            qus_current,
            qus_total,
            chs_question_display,
            chs_selected_keys,
            chs_current,
            chs_total,
            score,
            disorder,
            submitting
        } = this.state;

        const LoopCategory = (dat) =>
        {
            if (!dat || !dat.length)
            {
                return null;
            }

            return dat.map(ins => (
                <TreeNode
                    value={ ins.id }
                    title={ ins.name }
                    key={ ins.id }
                >
                    {
                        LoopCategory(ins.children)
                    }
                </TreeNode>
            ));
        };

        return (
            <div>
                <Title />
                <Nav
                    open="questions"
                    selected="papers"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qitem-single">
                            <div>名称</div>
                            <div>
                                <Input
                                    value={ name }
                                    onChange={ this.onNameChanged.bind(this) }
                                />
                            </div>
                        </div>
                        <div className="qitem-single qitem-double">
                            <div>
                                <div>分类</div>
                                <div>
                                    <TreeSelect
                                        className="category-select"
                                        value={ category }
                                        placeholder="请选择"
                                        allowClear
                                        treeDefaultExpandAll
                                        onChange={ this.onCategoryChanged.bind(this) }
                                    >
                                        {
                                            LoopCategory(cat_tree)
                                        }
                                    </TreeSelect>
                                </div>
                            </div>
                            <div>
                                <div>时长</div>
                                <div>
                                    <TimePicker
                                        allowEmpty={ false }
                                        value={ duration }
                                        minuteStep={ 1 }
                                        secondStep={ 5 }
                                        onChange={ this.onDurationChange.bind(this) }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="qitem-single qitem-double">
                            <div>
                                <div>选择题目</div>
                                <div className="pitem-questions">
                                    <div className="pitem-select">
                                        <TreeSelect
                                            className="category-select"
                                            value={ qus_category }
                                            placeholder="全部"
                                            allowClear
                                            treeDefaultExpandAll
                                            onChange={ this.onQuestionCategoryChanged.bind(this) }
                                        >
                                            {
                                                LoopCategory(qus_cat_tree)
                                            }
                                        </TreeSelect>
                                        <Input.Search
                                            value={ qus_search }
                                            placeholder="请输入题目名"
                                            onChange={ this.onSearchChange.bind(this) }
                                            onSearch={ this.onSearchQuestion.bind(this) }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div>总分值</div>
                                <div>
                                    <Input
                                        className="pitem-score"
                                        readOnly
                                        value={ score }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pitem-split">
                            <div>
                                <Table
                                    loading={ loading }
                                    dataSource={ questions }
                                    pagination={ false }
                                    size="middle"
                                    rowSelection={ {
                                        selectedRowKeys: qus_selected_keys,
                                        onChange: this.onQuestionChecked.bind(this)
                                    } }
                                >
                                    <Table.Column
                                        title="名称"
                                        dataIndex="name"
                                        key="name"
                                        width="40%"
                                    />
                                    <Table.Column
                                        title="类型"
                                        dataIndex="type"
                                        key="type"
                                        width="40%"
                                    />
                                    <Table.Column
                                        title="分值"
                                        dataIndex="score"
                                        key="score"
                                        width="20%"
                                    />
                                </Table>
                                <div className="qtbl-footer">
                                    <div className="qtbl-pagination">
                                        <Pagination
                                            size="small"
                                            current={ qus_current + 1 }
                                            pageSize={ count }
                                            total={ qus_total }
                                            showTotal={ total => `共计${total}项` }
                                            onChange={ this.onQuestionPageChange.bind(this) }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pitem-control">
                                <Button
                                    type="primary"
                                    disabled={ !(qus_selected_keys && qus_selected_keys.length) }
                                    onClick={ this.onAddQuestion.bind(this) }
                                >
                                    选择<Icon type="right" />
                                </Button>
                                <Button
                                    disabled={ !(chs_selected_keys && chs_selected_keys.length) }
                                    onClick={ this.onRemoveQuestion.bind(this) }
                                >
                                    <Icon type="left" />删除
                                </Button>
                            </div>
                            <div>
                                <Table
                                    dataSource={ chs_question_display }
                                    pagination={ false }
                                    size="middle"
                                    rowSelection={ {
                                        selectedRowKeys: chs_selected_keys,
                                        onChange: this.onChosenChecked.bind(this)
                                    } }
                                >
                                    <Table.Column
                                        title="名称"
                                        dataIndex="name"
                                        key="name"
                                        width="40%"
                                    />
                                    <Table.Column
                                        title="类型"
                                        dataIndex="type"
                                        key="type"
                                        width="40%"
                                    />
                                    <Table.Column
                                        title="分值"
                                        dataIndex="score"
                                        key="score"
                                        width="20%"
                                    />
                                </Table>
                                <div className="qtbl-footer">
                                    <div className="qtbl-pagination">
                                        <Pagination
                                            size="small"
                                            current={ chs_current + 1 }
                                            pageSize={ count }
                                            total={ chs_total }
                                            showTotal={ total => `共计${total}项` }
                                            onChange={ this.onChosenPageChange.bind(this) }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="qitem-single">
                            <div>题目乱序</div>
                            <div>
                                <Switch
                                    checked={ disorder }
                                    onChange={ this.onDisorderChange.bind(this) }
                                />
                            </div>
                        </div>
                        <Divider />
                        <div className="qitem-footer">
                            <Button
                                type="primary"
                                icon="save"
                                loading={ submitting }
                                onClick={ this.onSavePaper.bind(this) }
                            >保存试卷</Button>
                        </div>
                    </div>
                    <div className="sidebar">
                        <PaperResults value={ pid } />
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><PaperItem /></LocaleProvider>, document.getElementById('root'));
