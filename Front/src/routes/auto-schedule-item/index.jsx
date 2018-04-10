import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Divider, Icon, Input, LocaleProvider, message, Timeline } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import AutoSchedulePapers from '../../components/auto-schedule-papers';
import { AsyncRequest, GetURIParams, ROUTES } from '../../public';
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
            url_params: GetURIParams()
        };
    }

    componentDidMount()
    {
        const { url_params } = this.state;
        if (url_params.q)
        {
            this.ReadAutoSchedule((err, dat) =>
            {
                if (!dat)
                {
                    return;
                }

                dat.flow.forEach(ins => ins.id = ins._id);

                this.setState({
                    name: dat.name,
                    flow: dat.flow
                });
            });
        }
    }

    ReadAutoSchedule(cb)
    {
        const { url_params } = this.state;

        const pdt = {
            id: url_params.q
        };
        AsyncRequest('schedule/GetAutoSingle', pdt, (err, dat) =>
        {
            if (err || !dat)
            {
                delete url_params.q;
                message.error('读取试卷失败');

                return cb();
            }

            cb(null, dat);
        });
    }

    onChangeName(e)
    {
        this.setState({
            name: e.target.value
        })
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
        const { url_params, name, flow } = this.state;
        if (!name)
        {
            return message.warn('请输入名称');
        }

        if (!flow || !flow.length)
        {
            return message.warn('请选择试卷');
        }

        this.setState({ submitting: true });

        const pdt = {
            id: url_params.q,
            name,
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
            url_params,
            name,
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
