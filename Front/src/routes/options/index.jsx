import React from 'react';
import ReactDOM from 'react-dom';
import { Button, LocaleProvider, Tabs, TimePicker, message } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_SUCCESS_MESSAGE, DEFAULT_ERR_MESSAGE } from '../../public';
import '../../public/index.css';
import './index.css';

class AutoScheduleOptions extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            duration: defaultTime,
            loading: true
        };
    }

    componentDidMount()
    {
        AsyncRequest('system/GetAutoScheduleOptions', null, (err, dat) =>
        {
            if (err || !dat)
            {
                return this.setState({ loading: false });
            }

            const { default_timestamp } = this.state;
            const duration = moment.unix(default_timestamp + dat.duration || 0);

            this.setState({
                loading: false,
                duration
            });
        });
    }

    onDurationChange(value)
    {
        this.setState({ duration: value });
    }

    onSubmit()
    {
        const { default_timestamp, duration } = this.state;

        this.setState({ loading: true });

        const pdt = { duration: duration.unix() - default_timestamp };
        AsyncRequest('system/SaveAutoScheduleOptions', pdt, (err) =>
        {
            const func = err ? message.error : message.success;
            const msg = err ? DEFAULT_ERR_MESSAGE : DEFAULT_SUCCESS_MESSAGE;
            func(msg, undefined, () => this.setState({ loading: false }));
        });
    }

    render()
    {
        const { loading, duration } = this.state;

        return (
            <div className="form-root">
                <div>
                    <div>间隔时间</div>
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
                <div>
                    <div />
                    <div>
                        <Button
                            type="primary"
                            loading={ loading }
                            icon="save"
                            onClick={ this.onSubmit.bind(this) }
                        >保存</Button>
                    </div>
                </div>
            </div>
        )
    }
}

class Options extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {};
    }

    render()
    {
        return (
            <div>
                <Title />
                <Nav
                    open="system"
                    selected="options"
                />
                <div className="content-layout">
                    <div className="content">
                        <Tabs defaultActiveKey="auto-schedule">
                            <Tabs.TabPane
                                tab="自动派发"
                                key="auto-schedule"
                            >
                                <AutoScheduleOptions />
                            </Tabs.TabPane>
                        </Tabs>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Options /></LocaleProvider>, document.getElementById('root'));
