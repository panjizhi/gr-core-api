import React from 'react';
import { Icon, List, message, Pagination } from 'antd';
import { AsyncRequest, IsUndefined, ROUTES, SetURIParams } from '../../public';
import './index.css';

export default class QuestionPapers extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            qid: props.value,
            current: 0,
            count: 50,
            total: 0
        };
    }

    componentDidMount()
    {
        this.ReadPapers();
    }

    componentWillReceiveProps(nextProps)
    {
        if (nextProps.value !== this.state.qid)
        {
            this.state.qid = nextProps.value;
            this.ReadPapers();
        }
    }

    ReadPapers(current)
    {
        const { qid, count } = this.state;
        if (!qid)
        {
            return;
        }

        if (IsUndefined(current))
        {
            current = 0;
        }

        const pdt = {
            question: qid,
            start: current * count,
            count: count
        };
        AsyncRequest('paper/GetMany', pdt, (err, dat) =>
        {
            if (err)
            {
                return message.error('加载试卷出现错误');
            }

            const data = dat.records.map(ins =>
            {
                return {
                    id: ins._id,
                    name: ins.name
                };
            });

            this.setState({
                current: current,
                total: dat.total,
                records: data
            });
        });
    }

    onPageChange(page)
    {
        if (page < 1)
        {
            return;
        }

        this.ReadPapers(page - 1);
    }

    static onNavigate(id)
    {
        window.open(SetURIParams(ROUTES.PAPER_ITEM, { q: id }));
    }

    render()
    {
        const { current, count, total, records } = this.state;

        return (
            <div>
                <div className="qpps-container">
                    {
                        records && records.length ? records.map(ins => (
                            <div
                                key={ ins.id }
                                className="qpps-item"
                                onClick={ QuestionPapers.onNavigate.bind(this, ins.id) }
                            >
                                <Icon type="file-text" />
                                <a href="#">
                                    <div>{ ins.name }</div>
                                </a>
                            </div>
                        )) : null
                    }
                </div>
                <div className="qpps-pagination">
                    <Pagination
                        simple
                        current={ current + 1 }
                        pageSize={ count }
                        total={ total }
                        onChange={ this.onPageChange.bind(this) }
                    />
                </div>
            </div>
        )
    }
}
