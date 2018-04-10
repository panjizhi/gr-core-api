import React from 'react';
import { Radio } from 'antd';

export default class ScheduleSource extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { source: props.value };
    }

    onChange(e)
    {
        const { onChange } = this.props;
        onChange && onChange(e.target.value);
    }

    render()
    {
        const { source } = this.state;

        return (
            <Radio.Group
                onChange={ this.onChange.bind(this) }
                value={ source }
            >
                <Radio.Button value="manual">手动</Radio.Button>
                <Radio.Button value="auto">自动</Radio.Button>
            </Radio.Group>
        )
    }
}
