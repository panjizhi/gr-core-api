import React from 'react';
import { Icon, Table, Tooltip } from 'antd';
import { DOWNLOAD_ADDRESS, ROUTES, SetURIParams } from '../../public';

export default class ResultTable extends React.Component
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

    static ExportResult(record)
    {
        const { id } = record;
        window.location.href = SetURIParams(`${DOWNLOAD_ADDRESS}/result`, { id });
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
                    title="试卷"
                    dataIndex="paper"
                    key="paper"
                    width="17%"
                    render={ (text, record) => (
                        <div onClick={ ResultTable.ViewPaper.bind(this, record) }>
                            <a href="#">{ record.paper_name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="考生"
                    dataIndex="candidate"
                    key="candidate"
                    width="16%"
                    render={ (text, record) => (
                        <div onClick={ ResultTable.ViewCandidate.bind(this, record) }>
                            <a href="#">{ record.candidate_name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="满分"
                    dataIndex="full_score"
                    key="full_score"
                    width="12%"
                />
                <Table.Column
                    title="得分"
                    dataIndex="score"
                    key="score"
                    width="12%"
                />
                <Table.Column
                    title="考试时间"
                    dataIndex="created_time"
                    key="created_time"
                    width="19%"
                />
                <Table.Column
                    title="考试时长"
                    dataIndex="duration"
                    key="duration"
                    width="14%"
                />
                <Table.Column
                    title="操作"
                    key="action"
                    width="10%"
                    render={ (text, record) => (
                        <div>
                            <Tooltip title="导出答卷">
                                <Icon
                                    type="export"
                                    size="small"
                                    onClick={ ResultTable.ExportResult.bind(this, record) }
                                />
                            </Tooltip>
                        </div>
                    ) }
                />
            </Table>
        )
    }
}
