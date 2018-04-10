import React from 'react';
import { Icon, Menu } from 'antd';
import { ROUTES } from '../../public';

const { SubMenu } = Menu;

export default class Nav extends React.Component
{
    constructor(props)
    {
        super(props);
    }

    static Redirect({ item })
    {
        window.location.href = item.props.location;
    }

    render()
    {
        const { open, selected } = this.props;

        return (
            <div className="nav">
                <Menu
                    mode="inline"
                    defaultOpenKeys={ [open] }
                    selectedKeys={ [selected] }
                    style={ { borderRight: 0, minHeight: '600px' } }
                    onClick={ Nav.Redirect.bind(this) }
                >
                    <SubMenu key="questions" title={ <span><Icon type="file-text" /><span>试卷</span></span> }>
                        <Menu.Item key="questions" location={ ROUTES.QUESTIONS }>试题</Menu.Item>
                        <Menu.Item key="papers" location={ ROUTES.PAPERS }>试卷</Menu.Item>
                    </SubMenu>
                    <SubMenu key="candidates" title={ <span><Icon type="team" /><span>学生</span></span> }>
                        <Menu.Item key="candidates" location={ ROUTES.CANDIDATES }>学生</Menu.Item>
                        <Menu.Item key="results" location={ ROUTES.RESULTS }>成绩</Menu.Item>
                    </SubMenu>
                    <SubMenu key="schedules" title={ <span><Icon type="switcher" /><span>考试</span></span> }>
                        <Menu.Item key="schedules" location={ ROUTES.SCHEDULES }>派发列表</Menu.Item>
                        <Menu.Item key="schedule" location={ ROUTES.SCHEDULE }>新建派发</Menu.Item>
                        <Menu.Item key="auto-schedules" location={ ROUTES.AUTO_SCHEDULES }>自动派发</Menu.Item>
                    </SubMenu>
                    <SubMenu key="report" title={ <span><Icon type="area-chart" /><span>报表</span></span> }>
                        <Menu.Item key="candidate-report" location={ ROUTES.CANDIDATE_REPORT }>学生报表</Menu.Item>
                        <Menu.Item key="class-report" location={ ROUTES.CLASS_REPORT }>班级报表</Menu.Item>
                    </SubMenu>
                    <Menu.Item key="import" location={ ROUTES.IMPORT }>
                        <Icon type="upload" />
                        <span>导入</span>
                    </Menu.Item>
                </Menu>
            </div>
        )
    }
}
