import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon, LocaleProvider, message, Popconfirm, Timeline } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, ROUTES, SetURIParams } from '../../public';
import '../../public/index.css';
import './index.css';

class AutoSchedules extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: 1,
            done: null,
            current: 0,
            count: 50,
            total: 0
        };
    }

    componentDidMount()
    {
        this.ReadAutoSchedules();
    }

    ReadAutoSchedules()
    {
        this.DirectReadAutoSchedules((err, dat) => this.setState({
            loading: 0,
            schedules: dat
        }));
    }

    DirectReadAutoSchedules(cb)
    {
        const pdt = {
            limit: 5
        };
        AsyncRequest('schedule/GetAutoMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.DirectReadAutoSchedules(cb));
            }

            cb(null, dat);
        });
    }

    onRemove(id)
    {
        const pdt = { id };
        AsyncRequest('schedule/RemoveAutoSingle', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            this.ReadAutoSchedules();
        });
    }

    static onNavigateItem(id)
    {
        let url = ROUTES.AUTO_SCHEDULE_ITEM;
        if (id)
        {
            url = SetURIParams(url, { q: id });
        }

        window.open(url);
    }

    render()
    {
        const { loading, schedules } = this.state;

        const CreateNewButton = () =>
        {
            return (
                <Button
                    type="primary"
                    icon="plus"
                    onClick={ AutoSchedules.onNavigateItem.bind(this, 0) }
                >新建</Button>
            );
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
                        {
                            loading ? (null) : (schedules && schedules.length ? (
                                <div>
                                    <div className="flow-container">
                                        {
                                            schedules.map(ins =>
                                            {
                                                return (
                                                    <div
                                                        className="flow-block"
                                                        key={ ins._id }
                                                    >
                                                        <div className="flow-name">
                                                            <div onClick={ AutoSchedules.onNavigateItem.bind(this, ins._id) }>
                                                                <a href="#">{ ins.name }</a>
                                                            </div>
                                                            <div>
                                                                <Popconfirm title="确认删除此自动派发流程吗？" onConfirm={ this.onRemove.bind(this, ins._id) }>
                                                                    <Icon type="close" />
                                                                </Popconfirm>
                                                            </div>
                                                        </div>
                                                        <div className="flow-content">
                                                            <Timeline>
                                                                {
                                                                    ins.flow.map(paper =>
                                                                    {
                                                                        return (
                                                                            <Timeline.Item key={ paper._id }>{ paper.name }</Timeline.Item>
                                                                        );
                                                                    })
                                                                }
                                                                {
                                                                    ins.more ? (
                                                                        <Timeline.Item key={ `${ins._id}-more` }>
                                                                            <a href="#" onClick={ AutoSchedules.onNavigateItem.bind(this, ins._id) }>更多</a>
                                                                        </Timeline.Item>) : null
                                                                }
                                                            </Timeline>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                    <div className="content-bottom">
                                        {
                                            CreateNewButton()
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <div>还没有自动派发流程</div>
                                    <div>
                                        {
                                            CreateNewButton()
                                        }
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><AutoSchedules /></LocaleProvider>, document.getElementById('root'));
