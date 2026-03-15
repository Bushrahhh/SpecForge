from typing import List
from backend_models import FunctionalRequirement, UserStory


def infer_role(feature: str, description: str) -> str:
    # Decide who the main actor is based on keywords
    text = (feature + " " + description).lower()

    if "admin" in text:
        return "Admin"
    elif "system" in text or "automatically" in text:
        return "System"
    else:
        return "User"


def generate_acceptance_criteria(req: FunctionalRequirement, role: str) -> List[str]:
    # Simple acceptance criteria based on requirement text
    return [
        f"Given the {role.lower()} is authenticated",
        f"When the {role.lower()} performs the action: {req.feature.lower()}",
        f"Then the system should {req.description.lower()}"
    ]


def generate_user_stories(
    functional_requirements: List[FunctionalRequirement]
) -> List[UserStory]:
    # Convert functional requirements into user stories

    user_stories: List[UserStory] = []

    for req in functional_requirements:
        role = infer_role(req.feature, req.description)

        user_story = UserStory(
            role=role,
            action=req.feature,
            benefit="the system behaves as expected",
            acceptance_criteria=generate_acceptance_criteria(req, role)
        )

        user_stories.append(user_story)

    return user_stories


# Local test
if __name__ == "__main__":
    sample_reqs = [
        FunctionalRequirement(
            id=1,
            feature="Submit project description",
            description="allow users to submit a textual project idea",
            priority="High"
        ),
        FunctionalRequirement(
            id=2,
            feature="Export specification as PDF",
            description="generate a downloadable PDF document",
            priority="Medium"
        )
    ]

    stories = generate_user_stories(sample_reqs)

    for story in stories:
        print(story.model_dump())
