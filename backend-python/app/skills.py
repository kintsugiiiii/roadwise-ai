"""内置 Skill 与外部 Skill 的注册中心。"""
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Skill:
    name: str
    description: str
    instructions: str


BUILTIN_SKILLS = [
    Skill(
        "project_create",
        "基于用户请求和附件内容新建个人项目并生成环节、任务和图谱",
        "必须先阅读并提炼所有可读附件；从用户需求和附件事实判断项目类型，必须输出 projectType，且只能是“个人项目”“创业项目”“企业项目”之一，同时输出 typeReason。用户明确说“创业/商业/市场验证”，或材料涉及商业计划书、商业模式、产品、平台、资产管理、融资、客户付费时优先判断为创业项目；明确说“企业内部/SOP/组织流程”时判断为企业项目；只有个人研究、学习或个人工具才判断为个人项目。必须输出具体的 projectName 和 80-160字、最多3句的 summary 项目简介，只说明要解决的问题、面向对象、实施路径或预期产出；禁止把文件名、题号、长背景和完整材料分析塞进 summary。附件不为空时，attachments 必须逐个给出基于原文的 summary，不能只复述文件名。graph 至少包含 3 个有明确先后关系的阶段，每个阶段 description 必须结合附件事实，每个 tasks 必须是动作开头、可单独验收的具体任务；禁止使用“记录该节点的关键输入、执行过程、判断依据和阶段产出”等模板占位语。信息不足时标记待确认，并在 message 中说明引用了哪些附件内容。",
    ),
    Skill("project_edit", "编辑节点、任务和节点关系", "只修改用户明确指定的内容，保留未涉及的节点和任务。"),
    Skill("project_review", "结合图谱与成果材料进行项目评审", "按目标、过程、证据、结果和风险输出可追溯评审意见。"),
]

EXTERNAL_SKILLS: dict[str, dict[str, Any]] = {
    "grill-me": {"name": "grill-me", "description": "以严格审查方式挑战项目假设、方案和实施风险", "instructions": "按严格审查结构输出：重述、最强版本、假设、风险、反驳问题、自我挑战、结论和下一步。以代码、日志和配置为证据。", "enabled": True},
}


def list_skills() -> list[dict[str, Any]]:
    return [{"name": item.name, "description": item.description, "source": "builtin", "enabled": True} for item in BUILTIN_SKILLS] + [
        {**item, "source": "external"} for item in EXTERNAL_SKILLS.values()
    ]


def skill_context(skill_names: list[str] | None = None) -> str:
    selected = skill_names or [item.name for item in BUILTIN_SKILLS]
    all_items = {item.name: item for item in BUILTIN_SKILLS}
    external = EXTERNAL_SKILLS
    return "\n".join(
        f"Skill {name}: {(all_items[name].description + '. ' + all_items[name].instructions) if name in all_items else external[name]['description'] + '. ' + external[name]['instructions']}"
        for name in selected if name in all_items or name in external
    )
