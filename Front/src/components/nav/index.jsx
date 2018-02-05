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
                    <SubMenu key="questions" title={ <span><Icon type="file-text" /><span>考卷</span></span> }>
                        <Menu.Item key="questions" location={ ROUTES.QUESTIONS }>考题</Menu.Item>
                        <Menu.Item key="papers" location={ ROUTES.PAPERS }>试卷</Menu.Item>
                    </SubMenu>
                    <SubMenu key="candidates" title={ <span><Icon type="line-chart" /><span>考生</span></span> }>
                        <Menu.Item key="candidates" location={ ROUTES.CANDIDATES }>考生</Menu.Item>
                        <Menu.Item key="results" location={ ROUTES.RESULTS }>成绩</Menu.Item>
                    </SubMenu>
                    <SubMenu key="schedules" title={ <span><Icon type="switcher" /><span>考试</span></span> }>
                        <Menu.Item key="schedules" location={ ROUTES.SCHEDULES }>派发</Menu.Item>
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
