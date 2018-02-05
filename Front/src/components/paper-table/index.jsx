import React from 'react';
import { Icon, Popconfirm, Table } from 'antd';
import { ROUTES, SetURIParams } from '../../public';

export default class PaperTable extends React.Component
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

    static EditPaper(record)
    {
        window.location.href = SetURIParams(ROUTES.PAPER_ITEM, {
            q: record.id
        });
    }

    onRemove(record)
    {
        const { onRemove } = this.props;
        onRemove(record);
    }

    render()
    {
        const { loading, records } = this.state;

        return (
            <Table
                loading={ loading }
                dataSource={ records }
                pagination={ false }
            >
                <Table.Column
                    title="名称"
                    dataIndex="name"
                    key="name"
                    width="20%"
                    render={ (text, record) => (
                        <div onClick={ PaperTable.EditPaper.bind(this, record) }>
                            <a href="#">{ record.name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="分类"
                    dataIndex="category"
                    key="category"
                    width="14%"
                />
                <Table.Column
                    title="题数"
                    dataIndex="questions"
                    key="questions"
                    width="12%"
                />
                <Table.Column
                    title="时长"
                    dataIndex="duration"
                    key="duration"
                    width="12%"
                />
                <Table.Column
                    title="分数"
                    dataIndex="score"
                    key="score"
                    width="12%"
                />
                <Table.Column
                    title="最后更新时间"
                    dataIndex="updated_time"
                    key="updated_time"
                    width="20%"
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
