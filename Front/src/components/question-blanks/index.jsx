import React from 'react';
import { Input, InputNumber } from 'antd';
import './index.css';

export default class QuestionBlanks extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = QuestionBlanks.GetPropsValue(props);
    }

    static GetPropsValue(props)
    {
        const { value } = props;
        return {
            text: value ? value.text : null,
            count: value ? value.count : 0,
            answers: value ? value.answers : []
        };
    }

    componentWillReceiveProps(nextProps)
    {
        this.setState(QuestionBlanks.GetPropsValue(nextProps));
    }

    onValueChanged()
    {
        const { onValueChanged } = this.props;
        const { text, count, answers } = this.state;
        onValueChanged({
            text: text,
            count: count,
            answers: answers
        });
    }

    onTextChanged(e)
    {
        const value = e.target.value;

        let count = 0;
        if (value)
        {
            const marr = value.match(/_{1,}/g);
            if (marr)
            {
                count = marr.length;
            }
        }

        this.state.text = value;
        this.state.count = count;
        this.onValueChanged();

        this.setState({});
    }

    onCountChanged(value)
    {
        const iv = +value;
        if (!isNaN(iv))
        {
            this.state.count = iv;
            this.onValueChanged();
        }

        this.setState({});
    }

    onAnswerChanged(i, e)
    {
        let value = e.target.value.trim();
        value = value || null;

        const { answers } = this.state;
        while (answers.length < i)
        {
            answers.push(null);
        }
        answers[i] = value;

        this.onValueChanged();

        this.setState({});
    }

    render()
    {
        const { text, count, answers } = this.state;

        const IterCount = () =>
        {
            const arr = [];
            const al = answers ? answers.length : 0;

            for (let i = 0; i < count; ++i)
            {
                arr.push(
                    <div key={ i }>
                        <Input
                            placeholder={ `请输入第${i + 1}项答案` }
                            value={ i < al ? answers[i] : null }
                            onChange={ this.onAnswerChanged.bind(this, i) }
                        />
                    </div>
                );
            }

            return arr;
        };

        return (
            <div>
                <div className="qitem-single">
                    <div>文本</div>
                    <div>
                        <Input.TextArea
                            placeholder="请输入文本，以下划线作为填空处，例如：今天是____年__月__日"
                            rows={ 5 }
                            autosize={ {
                                minRows: 5,
                                maxRows: 10
                            } }
                            value={ text }
                            onChange={ this.onTextChanged.bind(this) }
                        />
                    </div>
                </div>
                <div className="qitem-single">
                    <div>空格数</div>
                    <div>
                        <InputNumber
                            width={ '200px' }
                            min={ 0 }
                            value={ count }
                            onChange={ this.onCountChanged.bind(this) }
                        />
                    </div>
                </div>
                <div className="qitem-single">
                    <div>答案</div>
                    <div className="qblk-answers">
                        { count > 0 ? IterCount() : null }
                    </div>
                </div>
            </div>
        )
    }
}
