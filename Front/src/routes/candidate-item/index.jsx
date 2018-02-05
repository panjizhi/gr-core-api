import React from 'react';
import ReactDOM from 'react-dom';
import { Button, LocaleProvider, message, Select } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import CandidateResults from '../../components/candidate-results';
import { AsyncRequest, GetURIParams, ROUTES } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class CandidateItem extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            submitting: false,
            upms: GetURIParams()
        };
    }

    componentDidMount()
    {
        const { q } = this.state.upms;
        if (!q)
        {
            return message.warn('考生信息不存在，即将返回考生列表', undefined, CandidateItem.onNavigateCandidates);
        }

        async.auto({
            candidate: (cb) =>
            {
                this.ReadCandidate(cb);
            },
            categories: (cb) =>
            {
                this.ReadCategories(cb);
            }
        }, (err, {
            candidate: ins,
            categories: cat
        }) =>
        {
            const state = {
                id: ins._id,
                avatar: ins.avatarUrl,
                name: ins.name,
                openid: ins.openid,
                registered_time: moment(ins.createTime).format('YYYY-MM-DD HH:mm:ss'),
                grade_options: cat.tree,
                grade: ins.grade || undefined,
                cat_dict: cat.dict,
                cat_tree: cat.tree,
            };

            if (ins.grade)
            {
                state.class_options = cat.dict[ins.grade].children;
                state.xclass = ins.class || undefined;
            }

            this.setState(state);
        });
    }

    ReadCandidate(cb)
    {
        const { upms } = this.state;

        const pdt = {
            id: upms.q
        };
        AsyncRequest('candidate/GetSingle', pdt, (err, dat) =>
        {
            if (err || !dat)
            {
                return message.warn('考生信息读取错误，即将返回考生列表', undefined, CandidateItem.onNavigateCandidates);
            }

            cb(null, dat);
        });
    }

    ReadCategories(cb)
    {
        AsyncRequest('candidate/GetCategories', null, (err, dat) =>
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

    onGradeChanged(value)
    {
        const { cat_dict } = this.state;

        this.setState({
            grade: value,
            class_options: value ? cat_dict[value].children : null,
            xclass: null
        });
    }

    onClassChanged(value)
    {
        this.setState({
            xclass: value
        });
    }

    onSaveCandidate()
    {
        const { id, grade, xclass } = this.state;

        this.setState({
            submitting: true
        });

        const pdt = {
            id: id,
            grade: grade,
            class: xclass
        };
        AsyncRequest('candidate/SaveSingle', pdt, (err) =>
        {
            if (err)
            {
                return message.error('保存考生信息失败，请重试', undefined, () =>
                {
                    this.setState({
                        submitting: false
                    });
                });
            }

            message.success('保存考生信息成功', undefined, () =>
            {
                this.setState({
                    submitting: false
                });
            });
        });
    }

    static onNavigateCandidates()
    {
        window.location.href = ROUTES.CANDIDATES;
    }

    render()
    {
        const {
            id,
            avatar,
            name,
            openid,
            grade_options,
            grade,
            class_options,
            xclass,
            registered_time,
            submitting
        } = this.state;

        const LoopSelect = (dat) =>
        {
            if (!dat || !dat.length)
            {
                return null;
            }

            return dat.map(ins => (
                <Select.Option
                    key={ ins.id }
                    value={ ins.id }
                >
                    { ins.name }
                </Select.Option>
            ));
        };

        return (
            <div>
                <Title />
                <Nav
                    open="candidates"
                    selected="candidates"
                />
                <div className="content-layout">
                    <div className="candidate-sidebar">
                        <div className="candidate-content">
                            <div className="citem-avatar">
                                <img src={ avatar } />
                            </div>
                            <div className="citem-nickname">{ name }</div>
                            <div className="qitem-single">
                                <div>OPENID</div>
                                <div>{ openid }</div>
                            </div>
                            <div className="qitem-single">
                                <div>注册时间</div>
                                <div>{ registered_time }</div>
                            </div>
                            <div className="qitem-single">
                                <div>年级</div>
                                <div className="citem-category">
                                    <Select
                                        allowClear={ true }
                                        value={ grade }
                                        placeholder="请选择"
                                        onChange={ this.onGradeChanged.bind(this) }
                                    >{ LoopSelect(grade_options) }</Select>
                                </div>
                            </div>
                            <div className="qitem-single">
                                <div>班级</div>
                                <div className="citem-category">
                                    <Select
                                        allowClear={ true }
                                        value={ xclass }
                                        placeholder="请选择"
                                        onChange={ this.onClassChanged.bind(this) }
                                    >{ LoopSelect(class_options) }</Select>
                                </div>
                            </div>
                            <div>
                                <Button
                                    type="primary"
                                    icon="save"
                                    loading={ submitting }
                                    onClick={ this.onSaveCandidate.bind(this) }
                                >保存考生信息</Button>
                            </div>
                        </div>
                    </div>
                    <div className="content">
                        <CandidateResults
                            value={ id }
                        />
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><CandidateItem /></LocaleProvider>, document.getElementById('root'));
