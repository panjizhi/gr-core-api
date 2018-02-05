import React from 'react';
import ReactDOM from 'react-dom';
import { Icon, LocaleProvider, message, Upload } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import Title from '../../components/title';
import Nav from '../../components/nav';
import { INTERFACE_PREFIX } from '../../public';
import '../../public/index.css';
import './index.css';

class Import extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { loading: false };
    }

    onUploadChanged(info)
    {
        const { file } = info;
        if (file.status === 'uploading')
        {
            this.setState({ loading: true });
        }
        else if (file.status === 'done')
        {
            const rspdt = file.response;
            const status = rspdt.status;

            Import.onCompleted(status);

            this.setState({ loading: false });
        }
        else if (file.status === 'error')
        {
            const { error } = file;

            Import.onCompleted(error && error.status === 413 ? 413 : 1);

            this.setState({ loading: false });
        }
    }

    static onCompleted(err)
    {
        const statDict = {
            413: '上传的文件太大，请重新选择'
        };

        if (err)
        {
            return message.error(statDict[err] || '上传失败，请稍后再试');
        }

        message.success('导入题目成功');
    }

    render()
    {
        let { loading } = this.state;

        return (
            <div>
                <Title />
                <Nav
                    open="import"
                    selected="import"
                />
                <div className="content-layout">
                    <div className="content">
                        <div className="content-container">
                            <Upload
                                className="import-container"
                                name="picture"
                                listType="picture-card"
                                showUploadList={ false }
                                action={ `${INTERFACE_PREFIX}open/upload/question` }
                                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={ this.onUploadChanged.bind(this) }
                            >
                                <div>
                                    <Icon
                                        className="import-icon"
                                        type={ loading ? 'loading' : 'file-text' }
                                    />
                                    <div className="import-text">请选择文档</div>
                                </div>
                            </Upload>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<LocaleProvider locale={ zh_CN }><Import /></LocaleProvider>, document.getElementById('root'));
