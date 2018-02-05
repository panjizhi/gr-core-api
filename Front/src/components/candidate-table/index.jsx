import React from 'react';
import { Table } from 'antd';
import { ROUTES, SetURIParams } from '../../public';
import './index.css';

export default class CandidateTable extends React.Component
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

    static ViewCandidate(record)
    {
        window.location.href = SetURIParams(ROUTES.CANDIDATE_ITEM, {
            q: record.id
        });
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
                    title={ null }
                    className="ctbl-avatar-box"
                    dataIndex="avatar"
                    key="avatar"
                    width="10%"
                    render={ (text, record) => (
                        <div
                            className="ctbl-avatar"
                            onClick={ CandidateTable.ViewCandidate.bind(this, record) }
                        >
                            <img className="ctbl-avatar" src={ record.avatar } />
                        </div>
                    ) }
                />
                <Table.Column
                    title="姓名"
                    dataIndex="name"
                    key="name"
                    width="20%"
                    render={ (text, record) => (
                        <div onClick={ CandidateTable.ViewCandidate.bind(this, record) }>
                            <a href="#">{ record.name }</a>
                        </div>
                    ) }
                />
                <Table.Column
                    title="年级"
                    dataIndex="grade"
                    key="grade"
                    width="15%"
                />
                <Table.Column
                    title="班级"
                    dataIndex="class"
                    key="class"
                    width="15%"
                />
                <Table.Column
                    title="OPENID"
                    dataIndex="openid"
                    key="openid"
                    width="25%"
                />
                <Table.Column
                    title="注册时间"
                    dataIndex="created_time"
                    key="created_time"
                    width="15%"
                />
            </Table>
        )
    }
}
