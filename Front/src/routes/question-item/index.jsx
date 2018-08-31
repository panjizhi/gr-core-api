import React from 'react';
import ReactDOM from 'react-dom';
import {
    Button,
    Divider,
    Input,
    InputNumber,
    LocaleProvider,
    message,
    Radio,
    Rate,
    Select,
    TreeSelect,
    Modal
} from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import PictureUpload from '../../components/picture-upload';
import QuestionRadio from '../../components/question-radio';
import QuestionBlanks from '../../components/question-blanks';
import QuestionCalculate from '../../components/question-calculate';
import QuestionArticle from '../../components/question-article';
import QuestionPapers from '../../components/question-papers';
import { AsyncRequest, GetURIParams, ROUTES, DEFAULT_ERR_MESSAGE, DEFAULT_SUCCESS_MESSAGE } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

const { TextArea } = Input;
const { Group: RadioGroup } = Radio;
const { Option } = Select;
const { TreeNode } = TreeSelect;

class QuestionItem extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            weight: 1,
            score: 1,
            qtype: 0,
            values: [
                null,
                null,
                null,
                null
            ],
            submitting: false,
            upms: GetURIParams()
        };
    }

    componentDidMount()
    {
        async.auto({
            categories: (cb) =>
            {
                this.ReadCategories(cb);
            },
            question: (cb) =>
            {
                this.state.upms.q ? this.ReadQuestion(cb) : cb();
            }
        }, (err, {
            categories: cat,
            question: qus
        }) =>
        {
            const { dict, tree } = cat;

            const state = {
                categories: dict,
                subject_options: tree
            };
            if (qus)
            {
                state.qid = qus._id;
                state.qname = qus.name;
                state.weight = qus.weight;
                state.score = qus.score;
                state.picture = qus.picture;
                state.explain = qus.explain;
                state.article = qus.article;

                const { subject } = qus;
                if (subject && subject in dict)
                {
                    state.subject = subject;
                    state.knowledge_options = dict[subject].children;

                    const { knowledges } = qus;
                    if (knowledges && knowledges.length)
                    {
                        const knlgs = [];
                        knowledges.forEach(ins => ins in dict && knlgs.push(ins));
                        state.knowledges = knlgs;
                    }
                }

                state.qtype = qus.qtype;

                const { values } = this.state;
                values[state.qtype] = qus.content;

                state.values = values;
            }

            this.setState(state);
        });
    }

    ReadQuestion(cb)
    {
        const { upms } = this.state;

        const pdt = {
            id: upms.q
        };
        AsyncRequest('question/GetSingle', pdt, (err, dat) =>
        {
            if (err || !dat)
            {
                delete upms.q;
                message.error('读取题目失败');

                return cb();
            }

            cb(null, dat);
        });
    }

    ReadCategories(cb)
    {
        AsyncRequest('question/GetCategories', null, (err, dat) =>
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
                key: ins._id,
                title: ins.name,
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

    onQTypeChange(e)
    {
        const value = e.target.value;
        this.setState({
            qtype: value
        });
    }

    onChangeName(e)
    {
        this.setState({
            qname: e.target.value
        })
    }

    onSubjectChanged(value)
    {
        const subj = this.state.categories[value];
        this.setState({
            subject: value,
            knowledges: [],
            knowledge_options: subj.children
        });
    }

    onKnowledgesChanged(value)
    {
        this.setState({
            knowledges: value
        });
    }

    onWeightChanged(value)
    {
        this.setState({
            weight: value
        });
    }

    onValueChanged(value)
    {
        const { qtype, values } = this.state;
        values[qtype] = value;
    }

    onScoreChanged(value)
    {
        const iv = +value;
        this.setState({
            score: isNaN(iv) ? 1 : iv
        });
    }

    onSaveQuestion()
    {
        const {
            qid,
            qname,
            qtype,
            subject,
            knowledges,
            weight,
            score,
            picture,
            explain,
            article,
            values
        } = this.state;
        if (!qname)
        {
            return message.warn('请填写题目基本信息');
        }

        const ctn = values[qtype];

        let msg = null;
        const check = [
            () =>
            {
                if (!ctn || !ctn.options || !ctn.options.length)
                {
                    msg = '请添加选项';
                    return 1;
                }

                if (ctn.right < 0)
                {
                    msg = '请选择正确答案';
                    return 1;
                }

                return 0;
            },
            () =>
            {
                if (!ctn || !ctn.text)
                {
                    msg = '请输入文本';
                    return 1;
                }

                if (!ctn.count)
                {
                    msg = '请添加填空位置';
                    return 1;
                }

                if (ctn.answers.length < ctn.count || !ctn.answers.every((ins) => !!ins))
                {
                    msg = '请设置全部答案';
                    return 1;
                }
            },
            () => 0,
            () => 0
        ];

        if (check[qtype]())
        {
            return message.warn(msg);
        }

        this.setState({ submitting: true });

        const pdt = {
            id: qid,
            name: qname,
            subject,
            knowledges,
            weight,
            score,
            picture,
            explain,
            qtype,
            content: ctn
        };
        if (article)
        {
            pdt.article = article._id;
        }

        AsyncRequest('question/SaveSingle', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ submitting: false }));
            }

            message.success(DEFAULT_SUCCESS_MESSAGE, () => window.location.href = ROUTES.QUESTIONS);
        });
    }

    onExplainChange(e)
    {
        this.setState({ explain: e.target.value });
    }

    onUploadCompleted(err, dat)
    {
        if (err)
        {
            return message.error(err);
        }

        this.setState({ picture: dat });
    }

    onSaveArticle()
    {

    }

    onArticleClose()
    {
        this.setState({ modal_visible: 0 });
    }

    render()
    {
        const {
            qid,
            qname,
            qtype,
            subject_options,
            subject,
            knowledge_options,
            knowledges,
            weight,
            score,
            explain,
            picture,
            article,
            values,
            submitting,
            modal_visible
        } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="questions"
                    selected="questions"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qitem-single">
                            <div>名称</div>
                            <div>
                                <TextArea
                                    rows={ 2 }
                                    autosize={ {
                                        minRows: 2,
                                        maxRows: 2
                                    } }
                                    value={ qname }
                                    onChange={ this.onChangeName.bind(this) }
                                />
                            </div>
                        </div>
                        <div className="qitem-single qitem-double">
                            <div>
                                <div>学科</div>
                                <div>
                                    <Select
                                        style={ {
                                            width: '50%'
                                        } }
                                        value={ subject }
                                        placeholder="请选择"
                                        onChange={ this.onSubjectChanged.bind(this) }
                                    >
                                        { subject_options ? subject_options.map(ins =>
                                            <Option key={ ins.key } value={ ins.key }>{ ins.title }</Option>) : null }
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <div>知识点</div>
                                <div>
                                    <TreeSelect
                                        style={ {
                                            width: '100%'
                                        } }
                                        value={ knowledges }
                                        placeholder="请选择"
                                        allowClear
                                        multiple
                                        treeDefaultExpandAll
                                        onChange={ this.onKnowledgesChanged.bind(this) }
                                    >
                                        {
                                            knowledge_options && knowledge_options.length ? knowledge_options.map(section =>
                                            {
                                                return (
                                                    <TreeNode
                                                        value={ section.key }
                                                        title={ section.title }
                                                        key={ section.key }
                                                        disabled
                                                    >
                                                        {
                                                            section.children && section.children.length ? section.children.map(knw =>
                                                            {
                                                                return (
                                                                    <TreeNode
                                                                        key={ knw.key }
                                                                        value={ knw.key }
                                                                        title={ knw.title }
                                                                    />
                                                                )
                                                            }) : null
                                                        }
                                                    </TreeNode>
                                                )
                                            }) : null
                                        }
                                    </TreeSelect>
                                </div>
                            </div>
                        </div>
                        <div className="qitem-single qitem-double">
                            <div>
                                <div>难度系数</div>
                                <div>
                                    <Rate
                                        count={ 5 }
                                        value={ weight }
                                        onChange={ this.onWeightChanged.bind(this) }
                                    />
                                </div>
                            </div>
                            <div>
                                <div>分数</div>
                                <div>
                                    <InputNumber
                                        min={ 1 }
                                        max={ 100 }
                                        value={ score }
                                        onChange={ this.onScoreChanged.bind(this) }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="qitem-single qitem-double">
                            <div>
                                <div>图片</div>
                                <div>
                                    <PictureUpload
                                        className="question-picture"
                                        value={ picture }
                                        onCompleted={ this.onUploadCompleted.bind(this) }
                                    />
                                </div>
                            </div>
                            <div>
                                <div>详细解析</div>
                                <div>
                                    <Input.TextArea
                                        rows={ 3 }
                                        autosize={ {
                                            minRows: 3,
                                            maxRows: 3
                                        } }
                                        value={ explain }
                                        onChange={ this.onExplainChange.bind(this) }
                                    />
                                </div>
                            </div>
                        </div>
                        {
                            article ? (<div className="qitem-single">
                                <div>题干</div>
                                <div className="question-article">
                                    <div>{ article.content }</div>
                                    {
                                        article.picture ? (<div className="question-article-picture">
                                            <img src={ article.picture } />
                                        </div>) : null
                                    }
                                </div>
                            </div>) : null
                        }
                        <div className="qitem-single">
                            <div>类型</div>
                            <div>
                                <RadioGroup onChange={ this.onQTypeChange.bind(this) } value={ qtype }>
                                    <Radio value={ 0 }>单选</Radio>
                                    <Radio value={ 1 }>填空</Radio>
                                    <Radio value={ 2 }>计算</Radio>
                                    <Radio value={ 3 }>写作</Radio>
                                </RadioGroup>
                            </div>
                        </div>
                        <div className="qitem-options">
                            {
                                [
                                    <QuestionRadio
                                        value={ values[0] }
                                        onValueChanged={ this.onValueChanged.bind(this) }
                                    />,
                                    <QuestionBlanks
                                        value={ values[1] }
                                        onValueChanged={ this.onValueChanged.bind(this) }
                                    />,
                                    <QuestionCalculate
                                        value={ values[2] }
                                        onValueChanged={ this.onValueChanged.bind(this) }
                                    />,
                                    <QuestionArticle
                                        value={ values[3] }
                                        onValueChanged={ this.onValueChanged.bind(this) }
                                    />
                                ][qtype]
                            }
                        </div>
                        <Divider />
                        <div className="qitem-footer">
                            <Button
                                type="primary"
                                icon="save"
                                loading={ submitting }
                                onClick={ this.onSaveQuestion.bind(this) }
                            >保存题目</Button>
                        </div>
                    </div>
                    <div className="sidebar">
                        <QuestionPapers
                            value={ qid }
                        />
                    </div>
                </div>
                <Modal
                    visible={ !!modal_visible }
                    width="800px"
                    onOk={ this.onSaveArticle.bind(this) }
                    onCancel={ this.onArticleClose.bind(this) }
                >
                </Modal>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><QuestionItem /></LocaleProvider>, document.getElementById('root'));
