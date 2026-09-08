import os
import sys
from google.analytics.admin import AnalyticsAdminServiceClient
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension

CREDENTIALS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "service_account.json"))
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH

def test_admin():
    print("Testando Google Analytics Admin API...")
    try:
        admin_client = AnalyticsAdminServiceClient()
        account_summaries = admin_client.list_account_summaries()
        properties_found = []
        for summary in account_summaries:
            print(f"Conta: {summary.display_name} ({summary.account})")
            for prop in summary.property_summaries:
                print(f"  -> Propriedade: {prop.display_name} ({prop.property})")
                properties_found.append((prop.display_name, prop.property))
        return properties_found
    except Exception as e:
        print(f"Admin Client: {e}")
        return []

def test_data(property_id):
    prop_str = property_id if str(property_id).startswith("properties/") else f"properties/{property_id}"
    print(f"\nTestando Google Analytics Data API para {prop_str}...")
    try:
        data_client = BetaAnalyticsDataClient()
        request = RunReportRequest(
            property=prop_str,
            dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
            metrics=[Metric(name="sessions"), Metric(name="activeUsers")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        response = data_client.run_report(request)
        print(f"Sucesso! {len(response.rows)} linhas retornadas.")
        for row in response.rows[:10]:
            source = row.dimension_values[0].value
            medium = row.dimension_values[1].value
            sessions = row.metric_values[0].value
            users = row.metric_values[1].value
            print(f"  {source} / {medium}: {sessions} sessões, {users} usuários")
        return True
    except Exception as e:
        print(f"Data Client para {prop_str}: {e}")
        return False

if __name__ == "__main__":
    props = test_admin()
    if props:
        for name, prop_resource in props:
            test_data(prop_resource)
    else:
        test_data("353199709")

