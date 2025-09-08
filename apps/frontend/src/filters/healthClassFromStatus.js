export default function (status) {
    if (status == "todo") return "health-normal"
    else if (status == "inprogress") return "health-good"
    else if (status == "done") return "health-best"
    else if (status == "postponed") return "health-bad"
    else if (status == "cancelled") return "health-bad"
    else if (status == "replanned") return "health-forget"
    return ""
}
