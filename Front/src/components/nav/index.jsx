import React from 'react';
import { Icon, Menu } from 'antd';
import { ROUTES, AsyncRequest, PERMISSIONS } from '../../public';

const { SubMenu } = Menu;

export default class Nav extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {};
    }

    componentDidMount()
    {
        this.ReadPermissions((err, dat) =>
        {
            this.setState({ value: dat });
        });
    }

    ReadPermissions(cb)
    {
        AsyncRequest('index/GetCurrentPermissions', null, (err, dat) =>
        {
            if (err)
            {
                return this.ReadPermissions(cb);
            }

            cb(null, dat);
        });
    }

    static Redirect({ item })
    {
        window.location.href = item.props.location;
    }

    render()
    {
        const { open, selected } = this.props;
        const { value } = this.state;
        const { level, detail } = value || {};

        return (
            <div className="nav">
                {
                    value ? (
                        <Menu
                            mode="inline"
                            defaultOpenKeys={ [open] }
                            selectedKeys={ [selected] }
                            style={ { borderRight: 0, minHeight: '600px' } }
                            onClick={ Nav.Redirect.bind(this) }
                        >
                            {
                                detail[PERMISSIONS.QUESTIONS] || detail[PERMISSIONS.PAPERS] ? (
                                    <SubMenu
                                        key="questions"
                                        title={ <span><Icon type="file-text" /><span>试卷</span></span> }
                                    >
                                        {
                                            detail[PERMISSIONS.QUESTIONS] ? (
                                                <Menu.Item key="questions" location={ ROUTES.QUESTIONS }>试题</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.PAPERS] ? (
                                                <Menu.Item key="papers" location={ ROUTES.PAPERS }>试卷</Menu.Item>
                                            ) : null
                                        }
                                    </SubMenu>
                                ) : null
                            }
                            {
                                detail[PERMISSIONS.CANDIDATES] || detail[PERMISSIONS.RESULTS] ? (
                                    <SubMenu
                                        key="candidates"
                                        title={ <span><Icon type="team" /><span>学生</span></span> }
                                    >
                                        {
                                            detail[PERMISSIONS.CANDIDATES] ? (
                                                <Menu.Item key="candidates" location={ ROUTES.CANDIDATES }>学生</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.RESULTS] ? (
                                                <Menu.Item key="results" location={ ROUTES.RESULTS }>成绩</Menu.Item>
                                            ) : null
                                        }
                                    </SubMenu>
                                ) : null
                            }
                            {
                                detail[PERMISSIONS.SCHEDULES] || detail[PERMISSIONS.NEW_SCHEDULE] || detail[PERMISSIONS.AUTO_SCHEDULE] ? (
                                    <SubMenu
                                        key="schedules"
                                        title={ <span><Icon type="switcher" /><span>考试</span></span> }
                                    >
                                        {
                                            detail[PERMISSIONS.SCHEDULES] ? (
                                                <Menu.Item key="schedules" location={ ROUTES.SCHEDULES }>派发列表</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.NEW_SCHEDULE] ? (
                                                <Menu.Item key="schedule" location={ ROUTES.SCHEDULE }>新建派发</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.AUTO_SCHEDULE] ? (
                                                <Menu.Item key="auto-schedules" location={ ROUTES.AUTO_SCHEDULES }>自动派发</Menu.Item>
                                            ) : null
                                        }
                                    </SubMenu>
                                ) : null
                            }
                            {
                                detail[PERMISSIONS.CANDIDATE_REPORT] || detail[PERMISSIONS.CLASS_REPORT] ? (
                                    <SubMenu
                                        key="report"
                                        title={ <span><Icon type="area-chart" /><span>报表</span></span> }
                                    >
                                        {
                                            detail[PERMISSIONS.CANDIDATE_REPORT] ? (
                                                <Menu.Item key="candidate-report" location={ ROUTES.CANDIDATE_REPORT }>学生报表</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.CLASS_REPORT] ? (
                                                <Menu.Item key="class-report" location={ ROUTES.CLASS_REPORT }>班级报表</Menu.Item>
                                            ) : null
                                        }
                                    </SubMenu>
                                ) : null
                            }
                            {

                                detail[PERMISSIONS.IMPORT] ? (
                                    <Menu.Item key="import" location={ ROUTES.IMPORT }>
                                        <Icon type="upload" />
                                        <span>导入</span>
                                    </Menu.Item>
                                ) : null
                            }
                            {
                                detail[PERMISSIONS.USERS] || detail[PERMISSIONS.PERMISSIONS] || detail[PERMISSIONS.OPTIONS] ? (
                                    <SubMenu key="system" title={ <span><Icon type="safety" /><span>系统</span></span> }>
                                        {

                                            detail[PERMISSIONS.USERS] ? (
                                                <Menu.Item key="users" location={ ROUTES.USERS }>用户</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.PERMISSIONS] ? (
                                                <Menu.Item key="permissions" location={ ROUTES.PERMISSIONS }>权限</Menu.Item>
                                            ) : null
                                        }
                                        {
                                            detail[PERMISSIONS.OPTIONS] ? (
                                                <Menu.Item key="options" location={ ROUTES.OPTIONS }>选项</Menu.Item>
                                            ) : null
                                        }
                                    </SubMenu>
                                ) : null
                            }
                        </Menu>
                    ) : null
                }
            </div>
        )
    }
}
