import React, { PureComponent } from 'react';
import { Avatar, Dropdown, Icon, Menu, Spin } from 'antd';
import { AsyncRequest, ROUTES } from '../../public';
import './index.css';

export default class Title extends PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {
            login: null,
            menu_options: {
                setting: Title.onNavigateSetting,
                logout: Title.onLogout
            }
        };
    }

    componentDidMount()
    {
        this.GetLogin();
    }

    GetLogin()
    {
        AsyncRequest('index/GetCurrent', null, (err, dat) =>
        {
            if (err)
            {
                return;
            }

            this.setState({
                login: dat
            });
        });
    }

    onMenuClick({ key })
    {
        this.state.menu_options[key]();
    }

    static onLogout()
    {
        AsyncRequest('index/logout', null, () =>
        {
            window.location.href = ROUTES.LOGIN;
        });
    }

    static onNavigateSetting()
    {
        window.location.href = ROUTES.SETTING;
    }

    render()
    {
        const { login } = this.state;

        return (
            <div className="header">
                <div className="logo">格润教育</div>
                {
                    login ? (
                        <Dropdown overlay={
                            <Menu
                                onClick={ this.onMenuClick.bind(this) }
                            >
                                <Menu.Item disabled><Icon type="user" />个人中心</Menu.Item>
                                <Menu.Item key="setting"><Icon type="setting" />设置</Menu.Item>
                                <Menu.Divider />
                                <Menu.Item key="logout"><Icon type="logout" />退出登录</Menu.Item>
                            </Menu>
                        }>
                            <div className="user">
                                <Avatar size="small">{ login.avatar ? null : (login.name ? login.name.substr(0, 1) : null) }</Avatar>
                                <span>{ login.name }</span>
                            </div>
                        </Dropdown>) : (<Spin size="small" />)
                }
            </div>
        )
    }
}
