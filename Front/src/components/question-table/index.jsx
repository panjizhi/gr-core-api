import React from 'react';
import { Icon, Popconfirm, Table } from 'antd';
import { ROUTES, SetURIParams } from '../../public';

export default class QuestionTable extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            loading: props.loading,
            records: props.value
        };
    }

    componentWillReceiveProps(nextProps)
    {
        let incr = 0;
        let state = {};

        const { loading, records } = this.state;
        if (nextProps.value !== records)
        {
            state.records = nextProps.value;
            ++incr;
        }
        if (nextProps.loading !== loading)
        {
            state.loading = nextProps.loading;
            ++incr;
        }

        incr && this.setState(state);
    }

    static EditQuestion(record)
    {
        let url = ROUTES.QUESTION_ITEM;
        if (record)
        {
            url = SetURIParams(url, {
                q: record.id
            });
        }
        window.location.href = url;
    }

    onRemove(record)
    {
        const { onRemove } = this.props;
        onRemove(record);
    }

    onTableChange(pagination, filters, sorter)
    {
        this.props.onChange(sorter && sorter.columnKey ? {
            field: sorter.columnKey,
            order: sorter.order === 'ascend' ? 1 : -1
        } : null);
    }

    render()
    {
        const { loading, records } = this.state;

        return (
            <Table
                loading={ loading }
                dataSource={ records }
                pagination={ false }
                onChange={ this.onTableChange.bind(this) }
            >
                <Table.Column
                    title="名称"
                    dataIndex="name"
                    key="name"
                    width="25%"
                    render={ (text, record) => (
                        <div onClick={ QuestionTable.EditQuestion.bind(this, record) }>
                            <a href="#">{ record.name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="学科"
                    dataIndex="subject"
                    key="subject"
                    width="10%"
                />
                <Table.Column
                    title="题型"
                    dataIndex="type"
                    key="type"
                    width="10%"
                />
                <Table.Column
                    title="难度系数"
                    dataIndex="weight"
                    key="weight"
                    width="10%"
                />
                <Table.Column
                    title="分数"
                    dataIndex="score"
                    key="score"
                    width="10%"
                />
                <Table.Column
                    title="知识点"
                    dataIndex="knowledges"
                    key="knowledges"
                    width="15%"
                />
                <Table.Column
                    title="错误率"
                    dataIndex="wrong_rate"
                    key="wrong_rate"
                    width="10%"
                    sorter={ true }
                />
                <Table.Column
                    title="操作"
                    key="action"
                    width="10%"
                    render={ (text, record) => (
                        <div>
                            <Popconfirm placement="topRight" title={ '是否移除\'' + record.name + '\'？' } onConfirm={ this.onRemove.bind(this, record) } okText="移除" cancelText="取消">
                                <Icon type="delete" size="small" />
                            </Popconfirm>
                        </div>
                    ) }
                />
            </Table>
        )
    }
}
