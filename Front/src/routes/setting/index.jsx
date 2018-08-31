import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Divider, Form, Icon, Input, LocaleProvider, message } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import PictureUpload from '../../components/picture-upload';
import { AsyncRequest, DEFAULT_ERR_MESSAGE } from '../../public';
import '../../public/index.css';
import './index.css';

class Password extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            confirmDirty: false,
            loading: false
        };
    }

    onCheckPassword(rule, value, cb)
    {
        const { form } = this.props;
        const { confirmDirty } = this.state;
        value && confirmDirty && form.validateFields(['confirm'], { force: true });
        cb();
    }

    onConfirmBlur(e)
    {
        const value = e.target.value;
        const { confirmDirty } = this.state.confirmDirty;
        this.setState({ confirmDirty: confirmDirty || !!value });
    }

    onCheckConfirm(rule, value, cb)
    {
        const { form } = this.props;
        cb(value && value !== form.getFieldValue('password') ? '两次输入的密码不一致' : undefined);
    }

    Submit({ original, password })
    {
        this.setState({
            loading: true
        });

        AsyncRequest('index/ResetPassword', {
            original: original,
            password: password
        }, (err) =>
        {
            if (err)
            {
                return message.error('原密码错误', undefined, () =>
                {
                    this.setState({
                        loading: false
                    })
                });
            }

            message.success('修改成功', undefined, () =>
            {
                window.location.reload();
            });
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

        const itemLayout = {
            labelCol: {
                span: 6
            },
            wrapperCol: {
                span: 18
            },
        };

        const tailLayout = {
            labelCol: {
                span: 6
            },
            wrapperCol: {
                span: 18,
                offset: 6
            },
        };

        return (
            <div>
                <Form onSubmit={ this.onSubmit.bind(this) } className="login-form">
                    <Form.Item
                        { ...itemLayout }
                        label="原密码"
                    >
                        {
                            getFieldDecorator('original', {
                                rules: [
                                    {
                                        required: true,
                                        message: '请输入原密码'
                                    }
                                ],
                            })(
                                <Input
                                    prefix={ <Icon type="lock" className="input-icon" /> }
                                    type="password"
                                    placeholder="原密码"
                                    maxLength="20"
                                />
                            )
                        }
                    </Form.Item>
                    <Form.Item
                        { ...itemLayout }
                        label="新密码"
                    >
                        {
                            getFieldDecorator('password', {
                                rules: [
                                    {
                                        required: true,
                                        min: 8,
                                        message: '请输入新密码，长度不少于8位'
                                    },
                                    {
                                        validator: this.onCheckPassword.bind(this),
                                    }
                                ],
                            })(
                                <Input
                                    prefix={ <Icon type="lock" className="input-icon" /> }
                                    type="password"
                                    placeholder="新密码"
                                    maxLength="20"
                                />
                            )
                        }
                    </Form.Item>
                    <Form.Item
                        label="确认密码"
                        { ...itemLayout }
                    >
                        {
                            getFieldDecorator('confirm', {
                                rules: [
                                    {
                                        required: true,
                                        message: '请输入确认密码'
                                    },
                                    {
                                        validator: this.onCheckConfirm.bind(this),
                                    }
                                ],
                            })(
                                <Input
                                    prefix={ <Icon type="lock" className="input-icon" /> }
                                    type="password"
                                    placeholder="确认密码"
                                    maxLength="20"
                                    onBlur={ this.onConfirmBlur.bind(this) }
                                />
                            )
                        }
                    </Form.Item>
                    <Form.Item { ...tailLayout }>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-submit"
                            loading={ loading }
                            icon="save"
                        >保存</Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}

const WrappedPassword = Form.create()(Password);

class Setting extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { loading: false };
    }

    componentDidMount()
    {
        AsyncRequest('index/GetCurrent', null, (err, dat) =>
        {
            if (err)
            {
                return;
            }

            this.setState({ avatar: dat.avatar });
        });
    }

    onUploadCompleted(err, dat)
    {
        if (err)
        {
            return message.error(err);
        }

        this.setState({
            avatar: dat,
            changed: 1
        });
    }

    onSaveAvatar()
    {
        const { avatar } = this.state;

        this.setState({ loading: true });

        AsyncRequest('index/SaveAvatar', { url: avatar }, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ loading: false }));
            }

            message.success('保存成功', undefined, () =>
            {
                window.location.reload();
            });
        });
    }

    render()
    {
        const { avatar, changed, loading } = this.state;

        return (
            <div>
                <Title />
                <Nav />
                <div className="content-layout">
                    <div className="content">
                        <div>
                            <div>修改密码</div>
                            <Divider />
                            <div className="password-container">
                                <WrappedPassword />
                            </div>
                        </div>
                        <div>
                            <div>修改头像</div>
                            <Divider />
                            <div>
                                <PictureUpload
                                    className="avatar"
                                    value={ avatar }
                                    onCompleted={ this.onUploadCompleted.bind(this) }
                                />
                            </div>
                            {
                                changed ?
                                    (
                                        <div>
                                            <Button
                                                className="save-avatar"
                                                type="primary"
                                                onClick={ this.onSaveAvatar.bind(this) }
                                                loading={ loading }
                                            >保存新头像</Button>
                                        </div>
                                    ) :
                                    null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Setting /></LocaleProvider>, document.getElementById('root'));
