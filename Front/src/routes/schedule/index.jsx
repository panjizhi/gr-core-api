import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Divider, LocaleProvider, message } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import SchedulePapers from '../../components/schedule-papers';
import ScheduleCandidates from '../../components/schedule-candidates';
import { AsyncRequest, ROUTES } from '../../public';
import '../../public/index.css';
import './index.css';

class Schedule extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            submitting: false
        };
    }

    onPaperChecked(checkedDict)
    {
        this.state.paper_dict = checkedDict;
    }

    onCandidateChecked(checkedDict)
    {
        this.state.candidate_dict = checkedDict;
    }

    onSaveSchedule()
    {
        const { paper_dict, candidate_dict } = this.state;

        const papers = Object.values(paper_dict);
        const candidates = Object.values(candidate_dict);
        if (!papers.length || !candidates.length)
        {
            return message.warning('请选择试卷和考生');
        }

        this.setState({
            submitting: true
        });

        const pdt = {
            candidates: candidates,
            papers: papers
        };
        AsyncRequest('schedule/SaveMany', pdt, (err) =>
        {
            if (err)
            {
                return message.error('发布失败', undefined, () =>
                {
                    this.setState({
                        submitting: false
                    });
                });
            }

            message.success('发布成功', () => window.location.href = ROUTES.SCHEDULES);
        });
    }

    render()
    {
        const { submitting } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="candidates"
                    selected="results"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="content-container">
                            <SchedulePapers onChecked={ this.onPaperChecked.bind(this) } />
                            <ScheduleCandidates onChecked={ this.onCandidateChecked.bind(this) } />
                        </div>
                        <Divider />
                        <div className="sch-submit">
                            <Button
                                type="primary"
                                icon="save"
                                loading={ submitting }
                                onClick={ this.onSaveSchedule.bind(this) }
                            >发布</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Schedule /></LocaleProvider>, document.getElementById('root'));
