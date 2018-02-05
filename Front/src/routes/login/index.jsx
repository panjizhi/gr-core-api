import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Form, Icon, Input, LocaleProvider, message } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import { AsyncRequest, GetURIParams, ROUTES } from '../../public';
import '../../public/index.css';
import './index.css';

class Login extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: false,
            upms: GetURIParams()
        };
    }

    Submit({ username, password })
    {
        const { upms } = this.state;

        this.setState({
            loading: true
        });

        AsyncRequest('index/login', {
            username: username,
            password: password
        }, (err) =>
        {
            if (err)
            {
                return message.error('用户名或密码错误', undefined, () =>
                {
                    this.setState({
                        loading: false
                    })
                });
            }

            window.location.replace(upms && upms.rd ? decodeURIComponent(upms.rd) : ROUTES.QUESTIONS);
        });
    }

    onSubmit(e)
    {
        e.preventDefault();
        this.props.form.validateFields((err, values) => !err && this.Submit(values));
    }

    render()
    {
        const { getFieldDecorator } = this.props.form;
        let { loading } = this.state;

        return (
            <div className="login-content">
                <div>
                    <div className="login-title">格润教育</div>
                    <div className="login-item">
                        <Form onSubmit={ this.onSubmit.bind(this) } className="login-form">
                            <Form.Item>
                                {
                                    getFieldDecorator('username', {
                                        rules: [
                                            {
                                                required: true,
                                                message: '请输入用户名/邮箱/手机号码'
                                            }
                                        ],
                                    })(
                                        <Input
                                            size="large"
                                            prefix={ <Icon type="user" className="input-icon" /> }
                                            placeholder="用户名/邮箱/手机号码"
                                            maxLength="20"
                                        />
                                    )
                                }
                            </Form.Item>
                            <div className="login-item" />
                            <Form.Item>
                                {
                                    getFieldDecorator('password', {
                                        rules: [
                                            {
                                                required: true,
                                                message: '请输入密码'
                                            }
                                        ],
                                    })(
                                        <Input
                                            size="large"
                                            prefix={ <Icon type="lock" className="input-icon" /> }
                                            type="password"
                                            placeholder="密码"
                                            maxLength="20"
                                        />
                                    )
                                }
                            </Form.Item>
                            <div className="login-item" />
                            <Form.Item>
                                <Button
                                    size="large"
                                    type="primary"
                                    htmlType="submit"
                                    className="login-submit"
                                    loading={ loading }
                                >登录</Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        )
    }
}

const WrappedLogin = Form.create()(Login);

ReactDOM.render(<LocaleProvider locale={ zh_CN }><WrappedLogin /></LocaleProvider>, document.getElementById('root'));
