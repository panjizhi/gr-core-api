import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Checkbox, Divider, Form, Icon, Input, LocaleProvider, message, Popconfirm, Select } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { AsyncRequest, DEFAULT_ERR_MESSAGE, ObjectReduce, PERMISSIONS } from '../../public';
import '../../public/index.css';
import './index.css';

const __permissions = [
    {
        name: '查看、创建和修改试题',
        key: PERMISSIONS.QUESTIONS
    },
    {
        name: '删除试题',
        key: PERMISSIONS.REMOVE_QUESTION
    },
    {
        name: '创建学科',
        key: PERMISSIONS.CREATE_SUBJECT
    },
    {
        name: '删除学科',
        key: PERMISSIONS.REMOVE_SUBJECT
    },
    {
        name: '查看、创建和修改试卷',
        key: PERMISSIONS.PAPERS
    },
    {
        name: '删除试卷',
        key: PERMISSIONS.REMOVE_PAPER
    },
    {
        name: '创建班级',
        key: PERMISSIONS.CREATE_CLASS
    },
    {
        name: '删除班级',
        key: PERMISSIONS.REMOVE_CLASS
    },
    {
        name: '查看和修改学生',
        key: PERMISSIONS.CANDIDATES
    },
    {
        name: '删除学生',
        key: PERMISSIONS.REMOVE_CANDIDATE
    },
    {
        name: '查看学生成绩',
        key: PERMISSIONS.RESULTS
    },
    {
        name: '查看和修改派发',
        key: PERMISSIONS.SCHEDULES
    },
    {
        name: '删除派发',
        key: PERMISSIONS.REMOVE_SCHEDULE
    },
    {
        name: '新建派发',
        key: PERMISSIONS.NEW_SCHEDULE
    },
    {
        name: '查看、创建、修改和删除自动派发',
        key: PERMISSIONS.AUTO_SCHEDULE
    },
    {
        name: '查看学生报表',
        key: PERMISSIONS.CANDIDATE_REPORT
    },
    {
        name: '查看班级报表',
        key: PERMISSIONS.CLASS_REPORT
    },
    {
        name: '导入',
        key: PERMISSIONS.IMPORT
    }
];

class Permissions extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            value: {},
            changed: 0,
            loading: 0
        };
    }

    componentDidMount()
    {
        this.ReadPermissions();
    }

    ReadPermissions()
    {
        AsyncRequest('index/GetConfigurablePermissions', null, (err, dat) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE, undefined, () => this.ReadPermissions());
            }

            const dict = dat.reduce((t, ins) => (t[ins.level] = ins, t), {});
            console.log(dict);

            this.setState({ permissions: dict });
        });
    }

    onCheckboxChange(level, ins, e)
    {
        const { permissions } = this.state;
        if (!permissions[level])
        {
            permissions[level] = {
                level,
                value: {}
            };
        }

        permissions[level].value[ins.key] = e.target.checked ? 1 : 0;
        console.log(permissions);

        this.setState({ changed: 1 });
    }

    onSave()
    {
        const { permissions } = this.state;

        this.setState({ loading: 1 });

        const pdt = ObjectReduce(permissions, (t, k, v) => (t.push(v), t), []);
        AsyncRequest('index/SaveConfigurablePermissions', pdt, (err) =>
        {
            if (err)
            {
                return message.error(DEFAULT_ERR_MESSAGE);
            }

            message.success('保存成功', undefined, () =>
            {
                this.setState({
                    changed: 0,
                    loading: 0
                });
                this.ReadPermissions();
            });
        });
    }

    render()
    {
        const { permissions, changed, loading } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="system"
                    selected="permissions"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="permission_table">
                            <div>
                                <div />
                                <div>管理员</div>
                                <div>班主任</div>
                                <div>学管</div>
                            </div>
                            {
                                permissions ? __permissions.map((ins, i) => (
                                    <div key={ i }>
                                        <div>{ ins.name }</div>
                                        <div>
                                            <Checkbox
                                                checked={ true }
                                                disabled={ true }
                                            />
                                        </div>
                                        {
                                            [2, 3].map(level =>
                                            {
                                                const p = permissions[level];
                                                return (<div key={ level }>
                                                    <Checkbox
                                                        checked={ p && p.value[ins.key] }
                                                        onChange={ this.onCheckboxChange.bind(this, level, ins) }
                                                    />
                                                </div>);
                                            })
                                        }
                                    </div>
                                )) : null
                            }
                        </div>
                        <div className="save">
                            {
                                changed ? (
                                    <Button
                                        type="primary"
                                        icon="save"
                                        loading={ !!loading }
                                        onClick={ this.onSave.bind(this) }
                                    >保存</Button>
                                ) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Permissions /></LocaleProvider>, document.getElementById('root'));
