import os
import sys
import argparse
from datetime import datetime
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension, OrderBy

# ID da propriedade oficial do Sir Fisher
PROPERTY_ID = "properties/353205396"

CREDENTIALS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "service_account.json"))
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH

def get_report(days=30):
    client = BetaAnalyticsDataClient()
    date_range = DateRange(start_date=f"{days}daysAgo", end_date="today")
    
    print("=" * 70)
    print(f"  RELATÓRIO DE ACESSOS SIR FISHER — ÚLTIMOS {days} DIAS")
    print("=" * 70)
    
    # 1. Tráfego por Origem / Mídia
    req_traffic = RunReportRequest(
        property=PROPERTY_ID,
        dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
        metrics=[
            Metric(name="sessions"),
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="engagementRate"),
            Metric(name="userEngagementDuration"),
        ],
        date_ranges=[date_range],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)]
    )
    res_traffic = client.run_report(req_traffic)
    
    print("\n--- 1. TRÁFEGO POR ORIGEM / MÍDIA ---")
    print(f"{'Origem / Mídia':<35} | {'Sessões':<8} | {'Usuários':<8} | {'Views':<6} | {'Eng. %':<7}")
    print("-" * 75)
    
    total_sessions = 0
    total_users = 0
    total_views = 0
    
    for r in res_traffic.rows:
        src = f"{r.dimension_values[0].value} / {r.dimension_values[1].value}"
        sess = int(r.metric_values[0].value)
        users = int(r.metric_values[1].value)
        views = int(r.metric_values[2].value)
        eng_rate = float(r.metric_values[3].value) * 100
        
        total_sessions += sess
        total_users += users
        total_views += views
        
        print(f"{src:<35} | {sess:<8} | {users:<8} | {views:<6} | {eng_rate:>5.1f}%")
        
    print("-" * 75)
    print(f"{'TOTAL':<35} | {total_sessions:<8} | {total_users:<8} | {total_views:<6} |")
    
    # 2. Comportamento e Eventos
    req_events = RunReportRequest(
        property=PROPERTY_ID,
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        date_ranges=[date_range],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)]
    )
    res_events = client.run_report(req_events)
    
    print("\n--- 2. PRINCIPAIS EVENTOS E CONVERSÕES ---")
    for r in res_events.rows:
        evt = r.dimension_values[0].value
        cnt = r.metric_values[0].value
        usr = r.metric_values[1].value
        print(f"  * {evt:<25}: {cnt:>5} ações ({usr:>4} usuários)")

    # 3. Foco específico no QR Code
    req_qr = RunReportRequest(
        property=PROPERTY_ID,
        dimensions=[Dimension(name="date"), Dimension(name="sessionSource")],
        metrics=[Metric(name="sessions")],
        date_ranges=[date_range],
        order_bys=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name="date"))]
    )
    res_qr = client.run_report(req_qr)
    qr_dates = {}
    for r in res_qr.rows:
        d = r.dimension_values[0].value
        src = r.dimension_values[1].value
        cnt = int(r.metric_values[0].value)
        if src == "qr_code":
            qr_dates[d] = cnt
            
    print("\n--- 3. LEITURAS DO QR CODE DAS MESAS POR DIA ---")
    if qr_dates:
        for d in sorted(qr_dates.keys()):
            formatted_date = f"{d[6:8]}/{d[4:6]}/{d[0:4]}"
            print(f"  * {formatted_date}: {qr_dates[d]} leituras")
        print(f"  Total no período: {sum(qr_dates.values())} leituras")
    else:
        print("  Nenhuma leitura registrada no período.")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Relatório de Analytics Sir Fisher")
    parser.add_argument("--days", type=int, default=30, help="Período em dias (padrão: 30)")
    args = parser.parse_args()
    get_report(args.days)

