import React from 'react';
import ReactDOM from 'react-dom';
import {
    Button,
    Divider,
    Form,
    Icon,
    Input,
    LocaleProvider,
    message,
    Modal,
    Popconfirm,
    Select,
    TreeSelect
} from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, IsUndefined } from '../../public';
import async from '../../public/workflow';
import '../../public/index.css';
import './index.css';

const __levels = [
    '系统管理员',
    '管理员',
    '班主任',
    '学管'
];

class Account extends React.Component
{
    constructor(props)
    {
        super(props);

        const { current: { level } } = this.props;

        const values = [];
        __levels.forEach((ins, i) => i > level && values.push({
            level: i,
            title: ins
        }));

        this.state = {
            confirmDirty: false,
            loading: false,
            levels: values
        };
    }

    Submit({ account, name, level })
    {
        this.setState({ loading: true });

        AsyncRequest('index/SaveUser', {
            account,
            name,
            level
        }, (err) =>
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

    onSubmit(e)
    {
        e.preventDefault();
        this.props.form.validateFields((err, values) => !err && this.Submit(values));
    }

    render()
    {
        const { getFieldDecorator } = this.props.form;
        const { loading, levels } = this.state;

        const itemLayout = {
            labelCol: {
                span: 4
            },
            wrapperCol: {
                span: 18
            },
        };

        const tailLayout = {
            labelCol: {
                span: 4
            },
            wrapperCol: {
                span: 18,
                offset: 4
            },
        };

        return (
            <div>
                {
                    levels && levels.length ?
                        (<Form onSubmit={ this.onSubmit.bind(this) } className="login-form">
                            <Form.Item
                                { ...itemLayout }
                                label="账号"
                            >
                                {
                                    getFieldDecorator('account', {
                                        rules: [
                                            {
                                                required: true,
                                                message: '请输入账号'
                                            }
                                        ],
                                    })(
                                        <Input
                                            prefix={ <Icon type="user" className="input-icon" /> }
                                            placeholder="用户名/邮箱/手机号码"
                                            maxLength="20"
                                        />
                                    )
                                }
                            </Form.Item>
                            <Form.Item
                                { ...itemLayout }
                                label="姓名"
                            >
                                {
                                    getFieldDecorator('name', {
                                        rules: [
                                            {
                                                required: true,
                                                message: '请输入姓名'
                                            }
                                        ],
                                    })(
                                        <Input
                                            prefix={ <Icon type="user" className="input-icon" /> }
                                            placeholder="姓名"
                                            maxLength="20"
                                        />
                                    )
                                }
                            </Form.Item>
                            <Form.Item
                                { ...itemLayout }
                                label="级别"
                            >
                                {
                                    getFieldDecorator('level', {
                                        initialValue: levels[0].level,
                                        rules: [
                                            {
                                                type: 'number',
                                                required: true,
                                                message: '请选择级别'
                                            }
                                        ],
                                    })(<Select>
                                        {
                                            levels.map((ins) => (<Select.Option
                                                key={ ins.level }
                                                value={ ins.level }
                                            >{ ins.title }</Select.Option>))
                                        }
                                    </Select>)
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
                        </Form>) :
                        null
                }

            </div>
        )
    }
}

const WrappedAccount = Form.create()(Account);

class Users extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { loading: 0 };
    }

    componentDidMount()
    {
        async.auto({
            users: (cb) =>
            {
                this.DirectReadUsers(cb);
            },
            current: (cb) =>
            {
                this.DirectReadCurrent(cb);
            },
            classes: (cb) =>
            {
                this.DirectReadClasses(cb);
            },
            subjects: (cb) =>
            {
                this.DirectReadSubjects(cb);
            }
        }, (err, { users, current, classes, subjects }) =>
        {
            this.setState({
                users,
                current,
                classes,
                subjects
            });
        });
    }

    DirectReadUsers(cb)
    {
        AsyncRequest('index/GetUsers', null, (err, dat) =>
        {
            if (err)
            {
                return setTimeout(() => this.DirectReadUsers(cb), 1000);
            }

            cb(null, dat);
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

    DirectReadClasses(cb)
    {
        AsyncRequest('candidate/GetCategories', null, (err, dat) =>
        {
            if (err)
            {
                return setTimeout(() => this.DirectReadClasses(cb), 1000);
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
            });
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

    onRemoveUser(user)
    {
        const pdt = { id: user._id };
        AsyncRequest('index/RemoveUser', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            window.location.reload();
        });
    }

    onResetUserPassword(user)
    {
        const pdt = { id: user._id };
        AsyncRequest('index/DirectResetPassword', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('重置成功');
        });
    }

    onOpenSetting(user)
    {
        this.setState({
            setting_visible: 1,
            setting_user: user,
            user_classes: user.classes,
            user_subjects: user.subjects
        });
    }

    onUserSettingSave()
    {
        const { setting_user, user_classes, user_subjects } = this.state;

        this.setState({ loading: 1 });

        const classes = user_classes && user_classes.length ? user_classes : null;
        const subjects = user_subjects && user_subjects.length ? user_subjects : null;

        const pdt = {
            user: setting_user._id,
            classes,
            subjects
        };
        AsyncRequest('index/SaveManagingContent', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.setState({ loading: 0 }));
            }

            this.state.setting_user.classes = classes;
            this.state.setting_user.subjects = subjects;

            this.setState({ loading: 0 });
            this.onUserSettingClose();
        });
    }

    onUserSettingClose()
    {
        this.setState({
            setting_visible: 0,
            setting_user: undefined,
            user_classes: undefined,
            user_subjects: undefined
        });
    }

    onClassesChange(classes)
    {
        this.setState({ user_classes: classes });
    }

    onSubjectsChange(subjects)
    {
        this.setState({ user_subjects: subjects });
    }

    render()
    {
        const { users, current, classes, subjects, setting_visible, user_classes, user_subjects, loading } = this.state;

        const LoopClasses = (dat, level) =>
        {
            if (IsUndefined(level))
            {
                level = 1;
            }

            return !dat || !dat.length ?
                null :
                dat.map(ins => <TreeSelect.TreeNode
                    value={ ins.id }
                    title={ ins.name }
                    key={ ins.id }
                    disabled={ level <= 1 }
                >
                    {
                        LoopClasses(ins.children, level + 1)
                    }
                </TreeSelect.TreeNode>);
        };

        const LoopSubjects = (dat) => !dat || !dat.length ?
            null :
            dat.map(ins => <TreeSelect.TreeNode
                value={ ins.id }
                title={ ins.name }
                key={ ins.id }
            />);

        return (
            <div>
                <Title />
                <Nav
                    open="system"
                    selected="users"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="user-container clear-both">
                            {
                                users ?
                                    (users.length ?
                                        users.map((ins) => (
                                            <div
                                                className="user-item"
                                                key={ ins._id }
                                            >
                                                <div className="user-remove">
                                                    <Popconfirm
                                                        placement="topRight"
                                                        title={ '是否删除\'' + ins.name + '\'？' }
                                                        onConfirm={ this.onRemoveUser.bind(this, ins) }
                                                        okText="确定"
                                                        cancelText="取消"
                                                    >
                                                        <Icon type="close" />
                                                    </Popconfirm>
                                                </div>
                                                <div className="user-reset">
                                                    <Popconfirm
                                                        placement="topRight"
                                                        title={ '是否重置\'' + ins.name + '\'登录密码？' }
                                                        onConfirm={ this.onResetUserPassword.bind(this, ins) }
                                                        okText="确定"
                                                        cancelText="取消"
                                                    >
                                                        <Icon type="reload" />
                                                    </Popconfirm>
                                                </div>
                                                {
                                                    ins.level > 1 ? (
                                                        <div
                                                            className="user-setting"
                                                            onClick={ this.onOpenSetting.bind(this, ins) }
                                                        >
                                                            <Icon type="setting" />
                                                        </div>
                                                    ) : null
                                                }
                                                <div className="user-avatar">
                                                    {
                                                        ins.avatar ?
                                                            (<img src={ ins.avatar } />) :
                                                            (<Icon
                                                                type="user"
                                                                style={ {
                                                                    fontSize: 72,
                                                                    color: 'rgba(0,0,0,0.1)'
                                                                } }
                                                            />)
                                                    }
                                                </div>
                                                <div className="user-detail">
                                                    <div className="user-name">
                                                        <div>{ ins.name }</div>
                                                        <div className="user-level">{ __levels[ins.level] }</div>
                                                    </div>
                                                    <div className="user-account">{ ins.login }</div>
                                                </div>
                                            </div>
                                        )) :
                                        (<div className="no-data">还没有可管理用户</div>)) :
                                    null
                            }
                        </div>
                    </div>
                    <div className="sidebar">
                        <div className="new-title">添加新用户</div>
                        <Divider />
                        {
                            current ? (
                                <WrappedAccount current={ current } />
                            ) : null
                        }
                    </div>
                </div>
                {
                    classes ? (
                        <Modal
                            title="班主任权限设置"
                            width="550px"
                            visible={ !!setting_visible }
                            onOk={ this.onUserSettingSave.bind(this) }
                            onCancel={ this.onUserSettingClose.bind(this) }
                            footer={ [
                                <Button
                                    key="back"
                                    onClick={ this.onUserSettingClose.bind(this) }
                                >取消</Button>,
                                <Button
                                    key="submit"
                                    type="primary"
                                    loading={ !!loading }
                                    onClick={ this.onUserSettingSave.bind(this) }
                                >确定</Button>,
                            ] }
                        >
                            <div className="modal-unit">
                                <div className="modal-label">选择管理的班级</div>
                                <div>
                                    <TreeSelect
                                        style={ { width: '500px' } }
                                        placeholder="请选择"
                                        allowClear
                                        multiple
                                        treeDefaultExpandAll
                                        value={ user_classes }
                                        onChange={ this.onClassesChange.bind(this) }
                                    >
                                        {
                                            LoopClasses(classes.tree)
                                        }
                                    </TreeSelect>
                                </div>
                            </div>
                            <div className="modal-unit">
                                <div className="modal-label">选择派发的学科</div>
                                <div>
                                    <TreeSelect
                                        style={ { width: '500px' } }
                                        placeholder="请选择"
                                        allowClear
                                        multiple
                                        treeDefaultExpandAll
                                        value={ user_subjects }
                                        onChange={ this.onSubjectsChange.bind(this) }
                                    >
                                        {
                                            LoopSubjects(subjects.tree)
                                        }
                                    </TreeSelect>
                                </div>
                            </div>
                        </Modal>
                    ) : null
                }
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Users /></LocaleProvider>, document.getElementById('root'));
