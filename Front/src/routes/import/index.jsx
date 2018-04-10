import React from 'react';
import ReactDOM from 'react-dom';
import { Icon, LocaleProvider, message, Upload } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { INTERFACE_PREFIX, DEFAULT_ERR_MESSAGE } from '../../public';
import '../../public/index.css';
import './index.css';

class Import extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            sections: [
                {
                    key: 'question',
                    title: '上传新题生成试卷'
                },
                {
                    key: 'paper',
                    title: '上传已有题目组成试卷'
                }
            ]
        };
    }

    onUploadChanged(section, info)
    {
        const { file } = info;
        if (file.status === 'uploading')
        {
            section.loading = 1;
            this.setState({});
        }
        else if (file.status === 'done')
        {
            const rspdt = file.response;
            const status = rspdt.status;

            Import.onCompleted(status);

            delete section.loading;
            this.setState({});
        }
        else if (file.status === 'error')
        {
            const { error } = file;

            Import.onCompleted(error && error.status === 413 ? 413 : 1);

            delete section.loading;
            this.setState({});
        }
    }

    static onCompleted(err)
    {
        const statDict = {
            413: '上传的文件太大，请重新选择'
        };

        if (err)
        {
            return message.error(statDict[err] || DEFAULT_ERR_MESSAGE);
        }

        message.success('导入成功');
    }

    render()
    {
        let { sections } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="import"
                    selected="import"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="content-container clear-both">
                            {
                                sections.map(ins => (<div
                                    className="section"
                                    key={ ins.key }
                                >
                                    <Upload
                                        className="import-container"
                                        name="picture"
                                        listType="picture-card"
                                        showUploadList={ false }
                                        action={ `${INTERFACE_PREFIX}open/upload/${ins.key}` }
                                        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        onChange={ this.onUploadChanged.bind(this, ins) }
                                        disabled={ !!ins.loading }
                                    >
                                        <div>
                                            <Icon
                                                className="import-icon"
                                                type={ ins.loading ? 'loading' : 'file-text' }
                                            />
                                            <div className="import-text">{ ins.title }</div>
                                        </div>
                                    </Upload>
                                </div>))
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Import /></LocaleProvider>, document.getElementById('root'));
