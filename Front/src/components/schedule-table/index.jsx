import React from 'react';
import { Table, Popconfirm, Icon } from 'antd';
import { ROUTES, SetURIParams } from '../../public';

export default class ScheduleTable extends React.Component
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

    static ViewPaper(record)
    {
        window.location.href = SetURIParams(ROUTES.PAPER_ITEM, {
            q: record.paper
        });
    }

    static ViewCandidate(record)
    {
        window.location.href = SetURIParams(ROUTES.CANDIDATE_ITEM, {
            q: record.candidate
        });
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
                    title="试卷"
                    dataIndex="paper"
                    key="paper"
                    width="20%"
                    sorter={ true }
                    render={ (text, record) => (
                        <div onClick={ ScheduleTable.ViewPaper.bind(this, record) }>
                            <a href="#">{ record.paper_name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="考生"
                    dataIndex="candidate"
                    key="candidate"
                    width="20%"
                    render={ (text, record) => (
                        <div onClick={ ScheduleTable.ViewCandidate.bind(this, record) }>
                            <a href="#">{ record.candidate_name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="派发时间"
                    dataIndex="scheduled_time"
                    key="scheduled_time"
                    width="15%"
                />
                <Table.Column
                    title="是否完成"
                    dataIndex="done"
                    key="done"
                    width="15%"
                    sorter={ true }
                />
                <Table.Column
                    title="完成时间"
                    dataIndex="completed_time"
                    key="completed_time"
                    width="15%"
                />
                <Table.Column
                    title="操作"
                    key="action"
                    width="15%"
                    render={ (text, record) => (
                        <div>
                            <Popconfirm
                                placement="topRight"
                                title={ '是否移除此项派发？' }
                                onConfirm={ this.onRemove.bind(this, record) }
                                okText="移除"
                                cancelText="取消"
                            >
                                <Icon type="delete" size="small" />
                            </Popconfirm>
                        </div>
                    ) }
                />
            </Table>
        )
    }
}
