import React from 'react';
import { Button, Icon, Input, message, Pagination, Table, Tooltip } from 'antd';
import moment from 'moment';
import { AsyncRequest, DOWNLOAD_ADDRESS, IsUndefined, ROUTES, SetURIParams } from '../../public';
import '../../public/index.css';
import './index.css';

export default class CandidateResults extends React.Component
{
    constructor(props)
    {
        super(props);

        const defaultTime = moment('2000-01-01 00:00:00');
        this.state = {
            default_timestamp: defaultTime.unix(),
            id: this.props.value,
            loading: false,
            current: 0,
            count: 10,
            total: 0
        };
    }

    componentDidMount()
    {
        this.ReadResults();
    }

    componentWillReceiveProps(nextProps)
    {
        if (nextProps.value !== this.state.id)
        {
            this.state.id = nextProps.value;
            this.ReadResults();
        }
    }

    ReadResults(current)
    {
        const { id, paper_name, count } = this.state;
        if (!id)
        {
            return;
        }

        if (IsUndefined(current))
        {
            current = 0;
        }

        this.setState({
            loading: true
        });

        const pdt = {
            candidate: id,
            paper_name: paper_name,
            start: current * count,
            count: count
        };
        AsyncRequest('result/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载成绩出现错误', undefined, () =>
                {
                    this.setState({
                        loading: false
                    });
                });
            }

            const { total, records } = dat;

            const rcds = this.FillResults(records);
            this.setState({
                loading: false,
                current: current,
                total: total,
                records: rcds
            });
        });
    }

    FillResults(records)
    {
        const { default_timestamp } = this.state;
        return records.map(ins =>
        {
            return {
                id: ins._id,
                key: ins._id,
                paper: ins.paper._id,
                paper_name: ins.paper.name,
                candidate: ins.candidate._id,
                candidate_name: ins.candidate.name,
                full_score: ins.paper.score,
                score: ins.score,
                duration: ins.duration ? moment.unix(default_timestamp + ins.duration).format('HH:mm:ss') : '无',
                created_time: ins.created_time ? moment.unix(ins.created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前'
            };
        });
    }

    onSearchChange(e)
    {
        const search = e.target.value;
        this.setState({
            search: search
        });
    }

    onSearchResult(text)
    {
        const value = text || null;
        if (this.state.paper_name !== value)
        {
            this.state.paper_name = value;
            this.ReadResults();
        }
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadResults(page - 1);
    }

    onExportWrongQuestions()
    {
        const { id } = this.state;
        window.location.href = SetURIParams(`${DOWNLOAD_ADDRESS}/wrong-questions`, { id });
    }

    static ViewPaper(record)
    {
        window.location.href = SetURIParams(ROUTES.PAPER_ITEM, {
            q: record.paper
        });
    }

    static ExportResult(record)
    {
        const { id } = record;
        window.location.href = SetURIParams(`${DOWNLOAD_ADDRESS}/result`, { id });
    }

    render()
    {
        const { loading, search, records, current, count, total } = this.state;

        return (
            <div>
                <div className="qtbl-search">
                    <Input.Search
                        value={ search }
                        placeholder="请输入要搜索的试卷名称"
                        onChange={ this.onSearchChange.bind(this) }
                        onSearch={ this.onSearchResult.bind(this) }
                        style={ {
                            width: 360
                        } }
                    />
                </div>
                <div className="rtbl-table">
                    <Table
                        loading={ loading }
                        dataSource={ records }
                        pagination={ false }
                    >
                        <Table.Column
                            title="试卷"
                            dataIndex="paper"
                            key="paper"
                            width="19%"
                            render={ (text, record) => (
                                <div onClick={ CandidateResults.ViewPaper.bind(this, record) }>
                                    <a href="#">{ record.paper_name }</a>
                                </div>
                            ) }
                        />
                        <Table.Column
                            title="满分"
                            dataIndex="full_score"
                            key="full_score"
                            width="16%"
                        />
                        <Table.Column
                            title="得分"
                            dataIndex="score"
                            key="score"
                            width="16%"
                        />
                        <Table.Column
                            title="考试时间"
                            dataIndex="created_time"
                            key="created_time"
                            width="23%"
                        />
                        <Table.Column
                            title="考试时长"
                            dataIndex="duration"
                            key="duration"
                            width="16%"
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
                                            onClick={ CandidateResults.ExportResult.bind(this, record) }
                                        />
                                    </Tooltip>
                                </div>
                            ) }
                        />
                    </Table>
                </div>
                <div className="qtbl-footer">
                    <Button
                        type="primary"
                        icon="export"
                        onClick={ this.onExportWrongQuestions.bind(this) }
                    >错题导出</Button>
                    <div className="qtbl-pagination">
                        <Pagination
                            current={ current + 1 }
                            pageSize={ count }
                            total={ total }
                            showTotal={ total => `共计${total}项` }
                            onChange={ this.onPageChange.bind(this) }
                        />
                    </div>
                </div>
            </div>
        )
    }
}
