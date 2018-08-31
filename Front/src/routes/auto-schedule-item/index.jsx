import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Divider, Icon, Input, LocaleProvider, message, Timeline, Select } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import AutoSchedulePapers from '../../components/auto-schedule-papers';
import { AsyncRequest, GetURIParams, ROUTES } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

class AutoScheduleItem extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            flow: [],
            submitting: false,
            argv: GetURIParams()
        };
    }

    componentDidMount()
    {
        async.auto({
            current: (cb) =>
            {
                this.DirectReadCurrent(cb);
            },
            subjects: (cb) =>
            {
                this.DirectReadSubjects(cb);
            },
            schedule: (cb) =>
            {
                const { argv } = this.state;
                if (!argv.q)
                {
                    return cb();
                }

                this.DirectReadAutoSchedule(cb);
            }
        }, (err, { current, subjects, schedule }) =>
        {
            let display = null;
            if (current.level > 1)
            {
                const dict = subjects.tree.reduce((t, ins) => (t[ins.id] = ins, t), {});
                display = current.subjects.reduce((t, ins) => (t.push(dict[ins]), t), []);
            }
            else
            {
                display = subjects.tree;
            }

            const state = { subjects: display };
            if (schedule)
            {
                schedule.flow.forEach(ins => ins.id = ins._id);
                state.name = schedule.name;
                state.subject = schedule.subject;
                state.flow = schedule.flow;
            }

            this.setState(state);
        });
    }

    DirectReadCurrent(cb)
    {
        AsyncRequest('index/GetCurrent', null, (err, dat) =>
        {
            if (err)
            {
                return setTimeout(() => this.DirectReadCurrent(cb), 1000);
            }

            cb(null, dat);
        });
    }

    DirectReadAutoSchedule(cb)
    {
        const { argv } = this.state;

        const pdt = {
            id: argv.q
        };
        AsyncRequest('schedule/GetAutoSingle', pdt, (err, dat) =>
        {
            if (err || !dat)
            {
                delete argv.q;
                message.error('读取试卷失败');

                return cb();
            }

            cb(null, dat);
        });
    }

    DirectReadSubjects(cb)
    {
        AsyncRequest('paper/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return setTimeout(() => this.DirectReadSubjects(cb), 1000);
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

    onChangeName(e)
    {
        this.setState({
            name: e.target.value
        })
    }

    onSubjectChange(subject)
    {
        this.setState({ subject });
    }

    onAppendPaper(checkedDict)
    {
        const papers = Object.values(checkedDict);
        if (!papers.length)
        {
            return;
        }

        const { index, flow } = this.state;

        const arr = [];

        function Append()
        {
            papers.forEach(ins => arr.push(ins));
        }

        let apd = 0;
        for (let i = 0, l = flow ? flow.length : 0; i < l; ++i)
        {
            if (i === index)
            {
                apd = 1;
                Append();
            }

            arr.push(flow[i]);
        }

        !apd && Append();

        this.setState({
            index: undefined,
            flow: arr
        });
    }

    onAppend(i)
    {
        this.setState({ index: i });
    }

    onRemove(i)
    {
        const { index, flow } = this.state;

        flow.splice(i, 1);
        let ni = index;

        if (index >= flow.length)
        {
            ni = undefined;
        }
        else if (index >= i && index > 0)
        {
            --ni;
        }

        this.setState({
            index: ni,
            flow
        });
    }

    onMoveUp(i)
    {
        if (i <= 0)
        {
            return;
        }

        const { flow } = this.state;

        const ins = flow[i];
        flow[i] = flow[i - 1];
        flow[i - 1] = ins;

        this.setState({ flow });
    }

    onMoveDown(i)
    {
        const { flow } = this.state;
        if (i >= flow.length - 1)
        {
            return;
        }

        const ins = flow[i];
        flow[i] = flow[i + 1];
        flow[i + 1] = ins;

        this.setState({ flow });
    }

    onCancelAppend()
    {
        const { index } = this.state;
        if (typeof index !== 'undefined')
        {
            this.setState({ index: undefined });
        }
    }

    onSave()
    {
        const { argv, name, subject, flow } = this.state;
        if (!name)
        {
            return message.warn('请输入名称');
        }

        if (!subject)
        {
            return message.warn('请选择学科');
        }

        if (!flow || !flow.length)
        {
            return message.warn('请选择试卷');
        }

        this.setState({ submitting: true });

        const pdt = {
            id: argv.q,
            name,
            subject,
            flow: flow.map(ins => ins.id)
        };
        AsyncRequest('schedule/SaveAutoSingle', pdt, (err) =>
        {
            if (err)
            {
                return message.error('网络繁忙，请稍后再试', undefined, () => this.setState({ submitting: false }));
            }

            message.success('保存成功', undefined, () => window.location.href = ROUTES.AUTO_SCHEDULES);
        });
    }

    render()
    {
        const {
            subjects,
            name,
            subject,
            index,
            flow,
            submitting
        } = this.state;

        const CreateTimeline = () =>
        {
            const arr = [];

            const Append = (last) =>
            {
                arr.push(
                    <Timeline.Item key="append">
                        <div
                            className="paper-append"
                            data-append={ last ? 0 : 1 }
                            onClick={ this.onCancelAppend.bind(this) }
                        >
                            <Icon type="plus" />
                        </div>
                    </Timeline.Item>
                );
            };

            let apd = 0;
            for (let i = 0, l = flow.length; i < l; ++i)
            {
                if (i === index)
                {
                    apd = 1;
                    Append();
                }

                const ins = flow[i];
                arr.push(
                    <Timeline.Item key={ ins.id }>
                        <div className="paper-item">
                            <div>{ ins.name }</div>
                            <div
                                className="paper-down"
                                onClick={ this.onMoveDown.bind(this, i) }
                            >
                                <Icon type="down" size="small" />
                            </div>
                            <div
                                className="paper-up"
                                onClick={ this.onMoveUp.bind(this, i) }
                            >
                                <Icon type="up" size="small" />
                            </div>
                            <div
                                className="paper-plus"
                                onClick={ this.onAppend.bind(this, i) }
                            >
                                <Icon type="plus" size="small" />
                            </div>
                            <div
                                className="paper-remove"
                                onClick={ this.onRemove.bind(this, i) }
                            >
                                <Icon type="close" size="small" />
                            </div>
                        </div>
                    </Timeline.Item>
                );
            }

            !apd && Append(1);

            return (<Timeline>{ arr }</Timeline>);
        };

        return (
            <div>
                <Title />
                <Nav
                    open="schedules"
                    selected="auto-schedules"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="qitem-single">
                            <div>名称</div>
                            <div>
                                <Input.TextArea
                                    rows={ 2 }
                                    autosize={ {
                                        minRows: 2,
                                        maxRows: 2
                                    } }
                                    value={ name }
                                    onChange={ this.onChangeName.bind(this) }
                                />
                            </div>
                        </div>
                        <div className="qitem-single">
                            <div>学科</div>
                            <div>
                                <Select
                                    style={ { width: '200px' } }
                                    placeholder="请选择学科"
                                    value={ subject }
                                    onChange={ this.onSubjectChange.bind(this) }
                                >
                                    {
                                        subjects ? subjects.map(ins => (
                                            <Select.Option key={ ins.id } value={ ins.id }>{ ins.name }</Select.Option>)) : null
                                    }
                                </Select>
                            </div>
                        </div>
                        <div className="qitem-single">
                            <div>流程</div>
                            <div>
                                {
                                    flow && flow.length > 0 ? CreateTimeline() : '暂无，请添加试卷'
                                }
                            </div>
                        </div>
                        <Divider />
                        <div className="qitem-footer">
                            <Button
                                type="primary"
                                icon="save"
                                loading={ submitting }
                                onClick={ this.onSave.bind(this) }
                            >保存</Button>
                        </div>
                    </div>
                    <div className="content">
                        <AutoSchedulePapers
                            disabled={ flow }
                            onSubmit={ this.onAppendPaper.bind(this) }
                        />
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(
    <LocaleProvider locale={ zh_CN }><AutoScheduleItem /></LocaleProvider>, document.getElementById('root'));
