# Azure Speech 说话人分离 PoC：合作伙伴摘要

## 管理结论

根因是 `azure-ai-transcription==1.0.0` 在仅设置 `maxSpeakers` 时，实际请求未序列化服务所需的 `diarization.enabled=true`。

修复前的净化请求定义：

```json
{"locales":["en-US"],"diarization":{"maxSpeakers":2}}
```

修复后的净化请求定义：

```json
{"locales":["en-US"],"diarization":{"maxSpeakers":2,"enabled":true}}
```

## 验证结果

- 官方双人控制样本：修复前 0/8 语句带 speaker；修复后 8/8，识别为 2 人，平均置信度约 0.927。
- 客户最长录音（净化标识 `customer-file-02.wav`）：自动语言识别为 `es-ES`，28/28 语句带 speaker，识别为 2 人，平均置信度约 0.603。
- `maxSpeakers` 设置为 3 或 4 时，最长录音仍稳定识别为 2 人且 28/28 语句带标签。
- 最长录音在 33.75 秒可比较非重叠区间内，speaker 与左右通道一致率为 100%。
- 五条客户录音中，两条缺少可识别语句；一条只有单人证据；另一条仅有两条低置信度语句。因此不能把单条成功结果外推到全部录音。

## 建议

1. 使用 Fast Transcription diarization 时显式发送 `enabled=true`。
2. 对未知语言录音使用 `--locale auto`；不要预设不匹配的 locale。
3. 双通道录音优先保留 channel transcription 作为确定性归属基线。
4. 仅对存在足够有效语句的录音评价 speaker 覆盖率和通道一致率。
5. 任何生产使用都应重新评估隐私、网络、身份、日志、配额和成本控制。

本包不含客户音频或客户转写文本。
